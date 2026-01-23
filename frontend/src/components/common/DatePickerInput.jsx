import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";

// Registrar locale español
registerLocale("es", es);

const DatePickerInput = ({
  selected,
  onChange,
  label,
  placeholderText = "",
  minDate = null,
  maxDate = null,
  required = false,
  className = "",
  disabled = false,
  dateFormat = "dd/MM/yyyy",
  showLabel = false,
}) => {
  const content = (
    <DatePicker
      selected={selected}
      onChange={onChange}
      locale="es"
      dateFormat={dateFormat}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholderText || "Seleccionar fecha"}
      className="input w-full"
      disabled={disabled}
      required={required}
      wrapperClassName="w-full"
    />
  );

  // Si showLabel es true, renderiza con label y div wrapper
  if (showLabel && label) {
    return (
      <div className={className}>
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {content}
      </div>
    );
  }

  // Si hay className, envuelve con div (manteniendo la disposición original)
  if (className) {
    return <div className={className}>{content}</div>;
  }

  // Si no, solo renderiza el DatePicker
  return content;
};

export default DatePickerInput;
