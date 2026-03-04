declare module "react-rainbow-components" {
  import React from "react";

  export interface DatePickerProps {
    value?: Date;
    onChange?: (value: Date) => void;
    formatStyle?: string;
    placeholder?: string;
    hideLabel?: boolean;
    borderRadius?: string;
    [key: string]: unknown;
  }

  export interface TimePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    hideLabel?: boolean;
    borderRadius?: string;
    hour24?: boolean;
    [key: string]: unknown;
  }

  export const DatePicker: React.FC<DatePickerProps>;
  export const TimePicker: React.FC<TimePickerProps>;
}
