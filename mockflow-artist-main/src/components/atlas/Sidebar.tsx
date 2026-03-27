import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  UserPlus,
  ChevronLeft,
  Target,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import forskaleLogo from "@/assets/forskale-logo.png";

const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

interface NavLink {
  type: "link" | "modal";
  icon: typeof CalendarDays | typeof RecordIcon;
  label: string;
  active?: boolean;
  href?: string;
}

type NavItem = NavLink;

const navItems: NavItem[] = [
  { type: "link", icon: CalendarDays, label: "Meeting Intelligence", active: true },
  {
    type: "link",
    icon: Video,
    label: "Meeting Insight",
    href: "https://id-preview--4caf4962-dc30-4bfa-ba4f-8d8465cb538d.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiI0Y2FmNDk2Mi1kYzMwLTRiZmEtYmE0Zi04ZDg0NjVjYjUzOGQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjRjYWY0OTYyLWRjMzAtNGJmYS1iYTRmLThkODQ2NWNiNTM4ZCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTgyNTUsIm5iZiI6MTc3MzM5MzQ1NSwiaWF0IjoxNzczMzkzNDU1fQ.rXjBJRCWl46S8edQUGgvctNvNoPYi3kZNQcsXPtH8vRvVWdAx8G6GJGb627NmEodg3kf3myMl1M3WmQRCg4mQjX3E7afuR4fNIx5e-5lQcejBhccRJtJsfXC-yPDIOE9OFQZOlP8Shw-H9wo7f4Tl2h725JOfg6PShxrSNZ6IO6_5OpKq6HaQwa_3nS3-TNtANDPzyAdp92kmJ9WOqWxUvipsMgleb-gQ_660ruaEnQct9tLZrv--Ro-Vz_TAgMY420EH-7t9sWfVF3-rSv8KNlZHTi-GgfkOH538P3lYQdLUL0_upgwCUIFJaGjbiCwiB5FrAkSyDaXjxX8QQ1oisnF71C_jmW2cctW_v92mvXl7PSEaGexz3RO8CjSub8IjFd59tC0oVLR_sHmEKNRe3t0q30Ma-yngDg4elejiFq6mdMchplr5EV4XEN0VWQvN4bahjZfUfQX8XTsu5iF68yRA7Zsli9Qo8agTFQOTB3XlBT0FHOI_Dqh7gKhU4OZbiu09g2yO3NBozZ8iAtdrFIlvWB2mVaq8vbVPvDOe0p3jTfaRJ3_MCIa6tdUdQn2jQLUzNONCkkzKfPi90gn1eREQbOhj4J9Z2RYTFkTHZkkT94PITsMpOUUklyPG5MM0PoXlvhCTeHEmWaQBC6I_o4Ygp0CUh697GC4b-L9u3A",
  },
  { type: "modal", icon: Target, label: "Strategy" },
  {
    type: "link",
    icon: ClipboardCheck,
    label: "Action Ready",
    href: "https://id-preview--d1d293c4-947a-481b-95cc-f184c5294154.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJkMWQyOTNjNC05NDdhLTQ4MWItOTVjYy1mMTg0YzUyOTQxNTQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImQxZDI5M2M0LTk0N2EtNDgxYi05NWNjLWYxODRjNTI5NDE1NCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTg0OTUsIm5iZiI6MTc3MzM5MzY5NSwiaWF0IjoxNzczMzkzNjk1fQ.PkHVjmDTj484m9kCIVTDcf6kzgu48l9RaT5KC6sGMrBRT_hoj8pAYSaPlS28tHER4dxPzS663efdflze-kQ8GpAMZ6XuBCfPP8s2ZG96UGdZnH3ylYH0stZGpAcqq3KD7iBe1AKrJVOIN505Nfs5VHX004rrwNKg8Dsp6uOzmIlza6fIqHVpHSOps29Kw5i018kvgi65JCNjenEF7iEOjPWcWUmWlES1kvPA2wLJGCY9ASmZQ8lJlCsVekkenqqD8oEbrPPPU0-0znO-R5fj83CQpqoSCM4Q6c35erDB0Z6O8euqwTtMrmoOv3LNZxikmBkOlzi6OVFgI0dfUBLFScB4Y5rWu7c-ZdcRrkbRU7nBEmMA61tAGjDEZPEPPIsprsb51HJ25IfQkqAi0UgEOWCUNi0J42Kt3DHW7HiZKJQZSazrnwZvaU-Ox_ikZuxZCJKJSR5i_NTtQEIrH-eXfs11PIqEDl4tS9DBc8iJ7YiBcgy1LQgKNEzeXkR5rwrV69zOoWYXn1DhnIOdC7I1kBkZChjTPxCmADYjJC5CLPGqdWCeAWAOrKRmYLdsbr7dBzqnpTFRYYVlAo5bilnH4LhxdNc6IpD6Y_TsqR6UJAjCXekTqEwnpYRrEQXvU3PirTmQYE4gmvfl3ITGzQJREjmxfv0zrHBfUMY3qKeO1ws",
  },
  {
    type: "link",
    icon: HelpCircle,
    label: "QnA Engine",
    href: "https://preview--visual-dreamer-box.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiIxODE1ZGIwYy0zNGQ2LTRhYzgtYjg3Ny0zOTBlNGNkZWVkMjIiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjE4MTVkYjBjLTM0ZDYtNGFjOC1iODc3LTM5MGU0Y2RlZWQyMiIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTg1MzUsIm5iZiI6MTc3MzM5MzczNSwiaWF0IjoxNzczMzkzNzM1fQ.ezjLkLf37lkLDc93SQ0QKrklhF0GqS31PPMOzofFl-u9eWiXmF5OTWG0N6cUQk-CXcZYMUb7x5gbWw0ZgeGLDKdwM9yB5OGB99fRXlbo_8bIuCtp8NSU-qac4G9YS9cy_0eQ17ub439Avm83PX0ftFQYDdzuUe5m64ASphvt37B-QMul5a4FrZZ-ubPdaZYZD0fhAi1qTdBAn4MgHVf7TBQKxomapwZPIX3h6BTbbwdOCN8Ur1GmVvEy_QNdssIoKg3vogbbwSshYyVfLmwJc69Yyazwt6r3z02XYFtpulNShIxqECwN01yw1ku00VYHkvI3BLlJqrSnQ8T750Efs6A6pMfw_bp54P7PhMFjKh6TkdisqN4KLlYjCF74OY6Y9arZTPRGpyGon3Sy1j2JBfGpHwJ_1_SMv3G__k-s58wCddCmms377zc89ta1ujdY4uieexZGzM_SdK7T4t8VNNEUpG0KGOdQGSBawJCahmIpFyyCtFaOfiJq2tUK9GvxRN-EROP1pRQhe4YvgWvrlfCE0LY2n6_MGfwp2zE6VFgtgD227DytmklbfNyAIiyaGkPZ87enCsURCoz0T-6aDSY7FbGeBBD6Xk91JRp9vSk33t0dtDlaovzNIgfPXePMPYxS--4c85kuHUVVThkI16tCfP7JA2KIIpEXSxhmJy0",
  },
  {
    type: "link",
    icon: BarChart3,
    label: "Performance",
    href: "https://id-preview--e1b43afe-3952-4b3d-ada7-71a82ffd0d18.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJlMWI0M2FmZS0zOTUyLTRiM2QtYWRhNy03MWE4MmZmZDBkMTgiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImUxYjQzYWZlLTM5NTItNGIzZC1hZGE3LTcxYTgyZmZkMGQxOCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTg0NjUsIm5iZiI6MTc3MzM5MzY2NSwiaWF0IjoxNzczMzkzNjY1fQ.YjY-ZViIX2zkxg2vu0DUTORYG7bv1i9P-wXt6HOeA0d0uG9HKSJHWJ2J2zPAORclZQgzG739O3m54zfuWeoODbgpW6bw1rTjo0nAidHSrl04CNYUMGlBgLurZ_xXOksrgOHVXgq6b-Yx4SVPgSnkIoscXxZOcNVD6gze9BXjSLjXWCt5QvuWn1ZLT1BjQvyhUUOEftUAYygUgQOUBWuyAxZu7nwWI88b0y8zxu9r7BzDj-1J5-xkkciPX2EHKRsrHtxnTOuh_VJI39gb0exezBoDyzsm-O-h83dU1EIHSdDPddiEfHBtXaYgI2heEt6kTcdpe8KdWh5JQ86_vSJwdutDx9_2wIid2t5gvht4a4ZnaW6HSDQ5NoSLtaIKF0H-5wb4kgVjMOqgKivjCkKTM_8rjOF6FFO7XysdMUYjOoxuD8V_OTlQvhQZZ9BUSPg6sgNEAtwBm2_TFpb4vUgGXghBa2dGOIsTW_bbtZbJ8ub51hhm5LVRN0H5U7z9h935_F-pLwTtDgfqcuAIg5d1g5sjrD7VX6FYFX8kxSjbgqj2lFXt7UB2Se7RiARfsmIdRPrG9Ownjp1d21AKuFn7Oeyst-OEQoVdNsteFACoMZ1IZ4Ro3elFsHs73bnQCpkrMxNL2tXa9NOjZMzrw-VmwNVRtjRJBsLic0RVnpqzSrs",
  },
  {
    type: "link",
    icon: BookOpen,
    label: "Knowledge",
    href: "https://id-preview--be8e5a0c-8e6e-4c82-9fc9-68f5b7626ee0.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJiZThlNWEwYy04ZTZlLTRjODItOWZjOS02OGY1Yjc2MjZlZTAiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImJlOGU1YTBjLThlNmUtNGM4Mi05ZmM5LTY4ZjViNzYyNmVlMCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTg1NzYsIm5iZiI6MTc3MzM5Mzc3NiwiaWF0IjoxNzczMzkzNzc2fQ.iwfzsdtlhitnhJqcoSjWLwKwxwC4nNZSMjk0HN9p4qo5b-8bAZ_JhoFOyWO8AT4MhOHObFv4SRSVUYgpQZdegD_QJ4C6Pnuo6QnytT7bjha5eH_pCHe3N8MG489YPtYX8oCGi7EY1Qrp7VAZx7Tu0qtXkLCdh8RRqdteDjAkbcU4RquHeu5iYz85r4ZG2z5vhnh39z2_Dj5juuW2eTEmPiYZ2ONNIcbErvGedrQ4nnVdKQ2swPrjDSLfzOPTNN-FPHo0sFthcCY4Jb5pR41MSzdZTR2-Ebo2Ioke85tFALOfX6qqKAdCRK19st8GD9XhFWItWcKN6qWItRZfhpajNTsDNR4W-Iz3K6awjmSDQORkQW36Vkplsa3fKxDDRxsn4cqPoUFNfAu4PoItPx6LLBow22wqde5qoFDyO4EMm1T5t5_TugVW1FbvhE2IuRb3tGW4BaSx7u9Zv7nZl6hq8FfIuxE9BKLnj0VoatpBVg_9lVXxEk5ezFvHNPPjRkt3ak_QHMGBLQ-hyF_hTfcQ2WSTEtsG2LBw_oAJN1SWByo19t2-LGE78ZjggH2ALVp5TT80xP2udDOshJuaxIH_orV6qI2wsmbn2ZEaJg3KtUHIf2AHDDYluR711pAziZ_BKnw6NS6uFjHpnZcPvAcfXpEJ523-qxqQ8Xb07V3VrEI",
  },
  {
    type: "link",
    icon: RecordIcon,
    label: "Record",
    href: "https://id-preview--bd05911a-d8fd-4ab9-aaa7-333d630b922e.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJiZDA1OTExYS1kOGZkLTRhYjktYWFhNy0zMzNkNjMwYjkyMmUiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImJkMDU5MTFhLWQ4ZmQtNGFiOS1hYWE3LTMzM2Q2MzBiOTIyZSIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTg5NzIsIm5iZiI6MTc3MzM5NDE3MiwiaWF0IjoxNzczMzk0MTcyfQ.F8Q_3lSNv5fmiWeznNbVm5yxsEppN6bBRIRI-xFuXmsUguRezsIIZudxrpuFWzHJJxY2nBHDKABOMw7eZyxVTRKEjEeey9EMnFf6_u-0eB7NIOx5Qw5g_EVptt6ACkGbivb9JshhVzWiIe8gg-zVBR1OANm6iHtKg1gdxk4InbuNecoXvVGAe-H0izYBsid_otOkvtxG5YKewJ-b9o9LN_H2kSNf2LbM8LujMU4RTmszWLwA-a-SCQvFEQ3WDoZwI1Tqz6gnZp4pLDfubGyXzwavsJNDrvHn4W0j5S9Ig1NgFd6FfTSXYvcCDHrksAlrV1iecDfL0rP_99VAqsMO7NhNDn5WPIkl52aS8NRZ2PKG4U3Ka7i8Yqmf5UGi1G6hurgT8T6NY5DOBmSzIkSm9Lfup8AWSNBODXPJGQtI0qB1Leph0l4_c1Hrqg6uYcBwuEB891mfJ_XDELx__j3ursX1QakO5ALImpSnXjDznimSnHPhfc2Ac-Tet7PbfyeH54nVeRf2Pw0P3Hyk5Gxp2YTG9vTix0HHSA_wT0ZZ6Ygbrpt-hYR2O_NgdkDanQPQ3bZ7hckrHK0UBxAWQoJ2vN1Bib-fY0iqyMG2PUhdtzzWT14aUm_PbHVMuSKh5o53rHB2LDrQIOadhMsiQZ7ddkNBuARhG3RQSphCYM8OV0I",
  },
];

/* ─── Strategy Coming Soon Modal ─── */
function StrategyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="strategy-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md animate-in fade-in zoom-in-95 duration-300 ease-out">
        {/* Gradient border glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] opacity-60 blur-sm" />

        <div className="relative rounded-2xl bg-white p-6 shadow-2xl">
          {/* Close button */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>

          {/* Title */}
          <h2 id="strategy-modal-title" className="text-center text-xl font-bold text-gray-900">
            Strategy – Coming Soon
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
            We're building a dedicated Strategy hub to help you plan plays, align teams, and track strategic initiatives across your accounts. Stay tuned – this space is almost ready.
          </p>

          {/* Features */}
          <ul className="mt-5 space-y-2.5">
            {[
              "Account playbooks and strategic plans",
              "Cross-meeting themes and opportunities",
              "Smart suggestions powered by Meeting Intelligence",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]" />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow duration-200 active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AtlasSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "relative group/sidebar flex flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        {/* Floating collapse/expand toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute top-16 -right-4 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-gray-500 hover:text-gray-800 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out invisible group-hover/sidebar:visible",
            collapsed && "rotate-180",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Header: Logo */}
        <div className="flex items-center px-4 py-5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={forskaleLogo}
              alt="ForSkale"
              className="h-16 w-16 flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]"
            />
            {!collapsed && <span className="whitespace-nowrap text-sm font-bold text-white tracking-wide">ForSkale</span>}
          </div>
        </div>

        {/* Gradient divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        {/* Navigation */}
        <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 scrollbar-thin">
          {navItems.map((item) => {
            const classes = cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 no-underline",
              collapsed && "justify-center px-0",
              item.active
                ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground",
            );
            const content = (
              <>
                <item.icon
                  className={cn("h-5 w-5 flex-shrink-0", item.active ? "stroke-[2px] text-white" : "stroke-[1.6px]")}
                />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </>
            );

            if (item.type === "modal") {
              return (
                <button key={item.label} className={classes} onClick={() => setStrategyOpen(true)}>
                  {content}
                </button>
              );
            }

            return item.href ? (
              <a key={item.label} href={item.href} className={classes}>
                {content}
              </a>
            ) : (
              <button key={item.label} className={classes}>
                {content}
              </button>
            );
          })}
        </nav>

        {/* Gradient divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        {/* Bottom: Invite + User */}
        <div className="px-3 py-3 space-y-2">
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              collapsed && "justify-center px-0",
            )}
          >
            <UserPlus className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Invite</span>}
          </button>

          <div className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2", collapsed && "justify-center px-0")}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] text-xs font-bold text-white">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">Andrea Marino</p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">andrea@forskale.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <StrategyModal open={strategyOpen} onClose={() => setStrategyOpen(false)} />
    </>
  );
}