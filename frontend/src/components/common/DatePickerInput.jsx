import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";

// Registrar locale español
registerLocale("es", es);

// Input de hora manual, con el mismo estilo que el resto de campos
// "input" del formulario — evita el selector nativo del navegador
// (input type="time"), que no se puede re-estilizar y rompe el tema oscuro.
// Ancho fijo por estilo inline: la clase compartida "input" trae w-full
// por @apply, que si no se sobreescribe así gana y ocupa todo el hueco.
const CustomTimeInput = ({ value, onChange }) => (
  <div className="flex justify-center w-full">
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="00:00"
      maxLength={5}
      style={{ width: "5rem" }}
      className="input text-sm text-center"
    />
  </div>
);

const DatePickerInput = ({
  selected,
  onChange,
  label,
  placeholderText,
  minDate = null,
  maxDate = null,
  required = false,
  className = "",
  disabled = false,
  dateFormat,
  showLabel = false,
  yearDropdownItemNumber = 50,
  showTimeSelect = false,
  showTimeInput = false,
  timeIntervals = 15,
  timeCaption = "Hora",
}) => {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const renderHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const currentYear = date.getFullYear();
    const computedMinYear = minDate ? minDate.getFullYear() : currentYear - 100;
    const computedMaxYear = maxDate ? maxDate.getFullYear() : currentYear + 10;
    const years = Array.from(
      { length: computedMaxYear - computedMinYear + 1 },
      (_, i) => computedMinYear + i,
    );

    const selectClass =
      "bg-[#0f0f0f] text-white text-xs px-2 py-1 rounded-md border border-[#2a2a2a] focus:outline-none focus:ring-0 focus:border-primary-500 appearance-none datepicker-select";
    const buttonClass =
      "px-2 py-1 rounded-md text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-40 text-xs";

    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1 bg-[#0f0f0f]">
        <button
          type="button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          className={buttonClass}
        >
          ‹
        </button>

        <div className="flex items-center gap-1 flex-1">
          <select
            value={date.getMonth()}
            onChange={(e) => changeMonth(Number(e.target.value))}
            className={`${selectClass} flex-1`}
          >
            {monthNames.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => changeYear(Number(e.target.value))}
            className={`${selectClass} w-24`}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          className={buttonClass}
        >
          ›
        </button>
      </div>
    );
  };

  const content = (
    <DatePicker
      selected={selected}
      onChange={onChange}
      locale="es"
      dateFormat={dateFormat || (showTimeSelect || showTimeInput ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy")}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholderText ?? "Seleccionar fecha"}
      className="input w-full"
      disabled={disabled}
      required={required}
      wrapperClassName="w-full"
      renderCustomHeader={renderHeader}
      showPopperArrow={false}
      showTimeSelect={showTimeSelect}
      showTimeInput={showTimeInput}
      customTimeInput={showTimeInput ? <CustomTimeInput /> : undefined}
      timeIntervals={timeIntervals}
      timeCaption={timeCaption}
      timeFormat="HH:mm"
      timeInputLabel="Hora:"
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