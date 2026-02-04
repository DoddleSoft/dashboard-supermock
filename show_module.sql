CREATE OR REPLACE FUNCTION get_module_hierarchy(target_module_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator to ensure RLS doesn't break the deep joins, but we manually check ownership below.
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
  result_data jsonb;
BEGIN
  -- 1. SECURITY & VALIDATION
  -- Check if the module exists AND belongs to a center owned by the requesting user (auth.uid())
  SELECT m.center_id INTO v_center_id
  FROM public.modules m
  JOIN public.centers c ON m.center_id = c.center_id
  WHERE m.id = target_module_id
  AND c.user_id = auth.uid(); -- Validates ownership via Supabase Auth

  -- If no match found, the user either doesn't own the center or the module doesn't exist.
  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: Module not found or you do not have permission to view it.';
  END IF;

  -- 2. DATA AGGREGATION
  -- We use correlated subqueries with jsonb_agg for maximum performance (single DB roundtrip).
  SELECT 
    to_jsonb(m.*) || jsonb_build_object(
      'sections', COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(s.*) || jsonb_build_object(
              'sub_sections', COALESCE(
                (
                  SELECT jsonb_agg(
                    to_jsonb(ss.*) || jsonb_build_object(
                      'questions', COALESCE(
                        (
                          SELECT jsonb_agg(qa.* ORDER BY qa.created_at)
                          FROM public.question_answers qa
                          WHERE qa.sub_section_id = ss.id
                        ), 
                        '[]'::jsonb
                      )
                    )
                    ORDER BY ss.sub_section_index ASC
                  )
                  FROM public.sub_sections ss
                  WHERE ss.section_id = s.id
                ), 
                '[]'::jsonb
              )
            )
            ORDER BY s.section_index ASC
          )
          FROM public.sections s
          WHERE s.module_id = m.id
        ), 
        '[]'::jsonb
      )
    )
  INTO result_data
  FROM public.modules m
  WHERE m.id = target_module_id;

  RETURN result_data;
END;
$$;