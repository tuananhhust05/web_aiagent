const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className="relative">
        <div
          className="rounded-full transition-all duration-500"
          style={{
            width: i === current ? 48 : 8,
            height: 8,
            background: i <= current
              ? "linear-gradient(135deg, #7ED321, #4ECDC4)"
              : "hsl(214 32% 91%)",
          }}
        />
        {i === current && (
          <div
            className="absolute inset-0 rounded-full blur-sm opacity-50"
            style={{ background: "linear-gradient(135deg, #7ED321, #4ECDC4)" }}
          />
        )}
      </div>
    ))}
  </div>
);

export default StepIndicator;
