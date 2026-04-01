type Option = string | { label: string; value: string };

const SelectField = ({
  value,
  onChange,
  options,
  placeholder,
  bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  bold?: boolean;
}) => {
  const getLabel = (opt: Option) => (typeof opt === "string" ? opt : opt.label);
  const getValue = (opt: Option) => (typeof opt === "string" ? opt : opt.value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-auto px-3 py-2 rounded-lg text-sm outline-none transition-all duration-300 appearance-none cursor-pointer"
      style={{
        background: "hsla(0 0% 100% / 0.6)",
        border: "1px solid hsl(214 32% 91%)",
        color: value ? "hsl(0 0% 10%)" : "hsl(215 16% 47%)",
        fontWeight: bold && value ? 700 : 400,
      }}
      onFocus={(e) => { e.target.style.borderColor = "hsla(176 58% 55% / 0.6)"; e.target.style.boxShadow = "0 4px 12px hsla(176 58% 55% / 0.15)"; }}
      onBlur={(e) => { e.target.style.borderColor = "hsl(214 32% 91%)"; e.target.style.boxShadow = "none"; }}
    >
      <option value="" disabled style={{ background: "#f8fafc" }}>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={getValue(opt)} value={getValue(opt)} style={{ background: "#f8fafc", color: "hsl(0 0% 10%)" }}>
          {getLabel(opt)}
        </option>
      ))}
    </select>
  );
};

export default SelectField;
