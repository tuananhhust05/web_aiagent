import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  FileText,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import forskaleLogo from "@/assets/forskale-logo.png";
import StrategyModal from "./StrategyModal";
import { useNavigate } from "react-router-dom";

const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  route?: string;
  action?: "strategy-modal";
};

const navItems: NavItem[] = [
  {
    icon: CalendarDays,
    label: "Meeting Intelligence",
    href: "https://preview--mockflow-artist.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJhYzAwNDUyNS03YTAwLTRjMDAtYjZhMC03OWUzYzIxY2JkYzciLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImFjMDA0NTI1LTdhMDAtNGMwMC1iNmEwLTc5ZTNjMjFjYmRjNyIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDEyOTcsIm5iZiI6MTc3MzEzNjQ5NywiaWF0IjoxNzczMTM2NDk3fQ.A0RfchOyUOGTyCuaL7t9lehtdGXh5ecH-ivR_5k9hmkh92bXDvxMjUXpyJLRbo2rpP2Fyib3UBeuiXPOosv8Py_R1rEtsLCHuuj7AxDnG_oQ7YfbGlDs-wgKv1EW0Hf88QfD-G8kifuHKiosBMlJsc9zXoOilxeO8ABeLQs8-pnoGu3bQWOZr0o0LUwLUDmgV07NlkKzBVjAYQX7PB-3In0CZxw5VQhG3UPlBh8KnR1dzsYLMQJECYuJw7Avr02Nl6UFQ01GPDriH846G1f_GafujagMBD1PNXT3EDoXq9dftemK1X_F1Hj9dRyAjeoQV_W-ji5eweUk-owTIG09Z4HnHZ5Cq1Z2_C8ghz39gcaddwlbzLwel7Wp_YqybeAkT_pGV1Sfb4N20rfg13KxOlJpAugCktXmG-HkUCFTpXIxcNCVOwq_MICPDrvmiS7bQq4MPsuJsaO2ff_bv1hDo8K_YbuIJ5NKBAaFDWDHQsUVd9hlXbSo5mamnwPAwb-jzgZH0r0jm-LrF6wdW_SjV70gA_Vt4zQ6CTli6fwmL2qY54Yd-CLI2gN1esQbLsubiGaeu0WoUirLT6aZmwUbEFwQPjLtSU6IliCcSpRa-0cgfaRqdQ8vExByCWd5DIQP_AbeEoj_zEr9ZukOljg_D1th6bCVTErKvs41qxxiPuo",
  },
  { icon: Video, label: "Meeting Insight", route: "/call-insights" },
  { icon: Target, label: "Strategy", action: "strategy-modal" },
  {
    icon: ClipboardCheck,
    label: "Action Ready",
    href: "https://id-preview--d1d293c4-947a-481b-95cc-f184c5294154.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJkMWQyOTNjNC05NDdhLTQ4MWItOTVjYy1mMTg0YzUyOTQxNTQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImQxZDI5M2M0LTk0N2EtNDgxYi05NWNjLWYxODRjNTI5NDE1NCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDEzMzAsIm5iZiI6MTc3MzEzNjUzMCwiaWF0IjoxNzczMTM2NTMwfQ.YIlf7slgRhr6rPFECas3OeGpVoNPnM9T-c4IdzqXCD9LEJ15ogJG7Da4ESToxWVK3CroAlsdYqwlCn9xwJqZNgANP1G2q50xY8EefkEX1-gMQt6dQoPpiG5HyFP5R2trPEF-oTrT9YzmaK1UTZjMRlnAywmrRrTfUGuvTBbRQX-Ld7okZldFVefZIiHR8yuIIhjAMo_VKoMgA3W2Ic-olLQihH1nMrFXJ0MzD9NtZ4450LZFgKC4MrzlldnUi6WuIBvSn1EU5dS6zvIzCnHre3BHgjHyZIeTnyauYUyeiLC5wgDmaMENX9oVqUcJeCiWHP2EvPK4ggYgr1HclO6ntGCX5tfxUdm-z3JV5TwrGDpJTZSzpPLSxHItAM7G5ZUwE6jgZUmQGT8CUK1gWWegCtILcNr1Ipq4nyv2EYbE_Wp4SlFmqNRWsGpEkRGp5gIZCdIXjhzVgTRgzpYFURHRu6zkAdeOZnOyqjPn0gdBsulAbJx1uhduIjT8ZO242HIINkS2eQVXJtED756G47bY5YQ8xDUxAJnv0oVGyovHpBYhtKH1DE8J-T3QbKcz0Bis5fDk1MWYVqpQ9C5XitJrmzW3v2CzAJajYksdQphejgmJDahXUI4_lT_6uIqrzmMxIogR75jJlTIAVJ8InVIAEN1Tu8J5XvKN0Ledl3jmddc",
  },
  {
    icon: HelpCircle,
    label: "QnA Engine",
    href: "https://id-preview--9e336b7f-4885-4309-abba-a0bc8bf87d2f.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWNlbU1Zd0FKSFJNb1FKUFh6STBDamg1QTVxMiIsInByb2plY3RfaWQiOiI5ZTMzNmI3Zi00ODg1LTQzMDktYWJiYS1hMGJjOGJmODdkMmYiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjllMzM2YjdmLTQ4ODUtNDMwOS1hYmJhLWEwYmM4YmY4N2QyZiIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDE1NjcsIm5iZiI6MTc3MzEzNjc2NywiaWF0IjoxNzczMTM2NzY3fQ.Jgv3uYOw4ImKaE0tSDzoSh4b5jtyYFc3xkFksZKdohpeplOZbQOIVxcWaxE7U93nPdDHJzjL860kknnfBDEkzy6oaLGgair4N4aDkouqxKiDzMrWIRDIcRfr6_lp6wRmX2QRVGDz2hCMIu3D3soF51F6fKfUjgvAHD4viV3vIyxCFzfkz2y310ZxZaDdsza_6qMDwMQqsjGIvwjF2npqp-99HbHov5XKpxCFTahtL36HEbbHm2s3yefpIsnqH4f5zprxVgEmW9vaWcKAxmlP28TbsEMjih2Kz6URfCUnSnT7FRetkEXrfoXjNZzOtMVCY8jq3ve-a394UwjLSR0QBlKtAuONCKlAXhIXoCS_zRffiElffx4y-qSapd5xpg0e21NAucW_zVbWqsj1_zEjBhoca9vz39Cjw0O5lA7C8gFa5RWPDI2ZGGdnbXI0wcSj_CaU28S0XAFWJoGCFozKGAHvWqqM-kSv3-sesOUQN_cEQzR-NHOy70oTIToLbPiEde7Up5wku_bq-Fc4juyG6dJovNDmVvV1N80-_w_es7WTGfgl9mB_emyU7GsVcAbo4tD74-M8KSLt7Vzjh_thQ9DH9J45FPvzF5reQzJUJhwflkYVvBpzs24r8oFFsQgLiT8lJC52r7-mpggbjxTbFOOZaZrU0y8od69yMzavyUQ",
  },
  {
    icon: BarChart3,
    label: "Performance",
    href: "https://id-preview--e1b43afe-3952-4b3d-ada7-71a82ffd0d18.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJlMWI0M2FmZS0zOTUyLTRiM2QtYWRhNy03MWE4MmZmZDBkMTgiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImUxYjQzYWZlLTM5NTItNGIzZC1hZGE3LTcxYTgyZmZkMGQxOCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTc1OTksIm5iZiI6MTc3MzM5Mjc5OSwiaWF0IjoxNzczMzkyNzk5fQ.cncf9MCzFDq07FL3kaFXJl55rzI5pw1GS8hdxDLAGdWAxgO2G7M8NzaFA3A6kzx1yunpmwlHuoewBeOARZStbS_vrKhCtQfDwaiCUUE1t86O4qasqSI2zG5g1kXgOBymPmhinmtU-1IsICLn_5W9HTbfkCBDkR2bk6ddpvp_3U0ZlJkjK9EsTYHyzqKHy49JYTGniAC2FsyGHQMo4MzYSj2WxrAFawfgHmHulWUPixI_V-TPVnNOdq2Wvh0D8rl41AvofyAhxCcJf1MBHThafhgK0kL5gFZvt-5b1Iq5eiQyUl1DW9UN74etcyB6rYlbvfE312vR9UWDSbyUH8MMSvA_wCuxEVCUvVGi5XoXCL-K1HnfcWoMRFTnlvhhX7H7O2hph9ht7QJj2q7897HGpFHlH5YKKRSNi6XxDg8SMGeWQIEYb60kItTa5rE70EqsrvNj-5tYd9u48g1C64wsgGmmFSIfUWmbswhXOXyNOUxJL1n2u-Z8VZ0UVzca4eUlkNi71AEJhhoqAOH1WOHDpJKx3renry0nrxgHvz0NKmlf8dGBG0QU31LcU2jMHmMBoKSu7FsY_a5QIjW3jFtQYnLRIS6HbyaMnpAQqxQfaZT57ly7zHKUVNwMWit3xyJAS8i6PD6Lx4EPQGT7DIp3R3CLdgI5GNCfm7u5BNlycXc",
  },
];

type SettingsSubItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  route?: string;
};

const settingsSubItems: SettingsSubItem[] = [
  {
    icon: BookOpen,
    label: "Knowledge",
    href: "https://id-preview--be8e5a0c-8e6e-4c82-9fc9-68f5b7626ee0.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJiZThlNWEwYy04ZTZlLTRjODItOWZjOS02OGY1Yjc2MjZlZTAiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImJlOGU1YTBjLThlNmUtNGM4Mi05ZmM5LTY4ZjViNzYyNmVlMCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5ODg1MjgsIm5iZiI6MTc3MzM4MzcyOCwiaWF0IjoxNzczMzgzNzI4fQ.H02MHACdZPkGDim41DDoNNzZQpuNujfKNxxm0Y1L64JIqdpUgG7s-tF3oGFmXACt0QsxZ3jSkppSCkZafvJ7gjx-hp7-rAwRtbSx1emj8jagoYF_YyJ8I2q9Ii0gCgBfmOp1TBNUEA5UK53GKSDmdrJRw1UQ7u_0-OYx94UUVamJlYSEAqyosZs2okDMrvYXbkJ--Ggj4vNmfTed_0dmKPl8_VGeaCXaiYU064DTKjV56KQABFbnloZ48Jdsc1N-LxS_C1juWtRVcKD2ZwNDeAKFfOECryd0Hxwk6nMxEvs6kO5JjE5UCTa-sSGFpMT38N24R5wQ2EhtSKEg7HBup-9X0N50K8OqMdACeJYmZAd_8cmT6rFkduWp9KkP0H4wJrMOiolUc3jlf37429O7drTTv9Is1khgO5DOw_Vw6HSpe5wWLiosJc14B_S5nUKmQwHpZ_AcDs1SjlLwtB5dG83LwGivWG6xX3RcoJlXdxXapn8unkaejOlIQAHT__7mVMtZKZ25-WZeofzP6LSDBEOwL7rJUyBNSGJ-9k3Lm3MroU5Nb646kmkxfwlSlslnHf6pDZ-E-pLdn5FUGhEOIC7NoX6IYM37yeTd6Z02IzoEezK72pYnOadmhRo-QrJVSDuhWEY4GBIuuheG4aTsoU4tSDWQuoz6xlNBD9NG70E",
  },
  { icon: RecordIcon, label: "Record" },
  { icon: FileText, label: "Meeting Templates", route: "/meeting-templates" },
];


interface AppNavSidebarProps {
  activeNav?: string;
}

const AppNavSidebar = ({ activeNav }: AppNavSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleNavClick = (item: NavItem) => {
    if (item.action === "strategy-modal") {
      setStrategyModalOpen(true);
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const isActive = (item: NavItem | SettingsSubItem) => {
    if (activeNav) return item.label === activeNav;
    if (item.route) return window.location.pathname === item.route;
    return false;
  };

  const isSettingsActive = settingsSubItems.some((sub) => isActive(sub));

  const updateSubmenuPos = useCallback(() => {
    if (settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSubmenuPos({ top: rect.top, left: rect.right + 8 });
    }
  }, []);

  const showSettings = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    updateSubmenuPos();
    setSettingsOpen(true);
  };

  const hideSettings = () => {
    hideTimeoutRef.current = setTimeout(() => setSettingsOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleSubItemClick = (item: SettingsSubItem) => {
    if (item.route) {
      navigate(item.route);
      setSettingsOpen(false);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "group/sidebar relative h-screen flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))]",
          collapsed ? "w-[72px] min-w-[72px]" : "w-60 min-w-60",
        )}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute top-16 -right-4 z-40 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-white text-gray-500 hover:text-gray-800",
            "shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]",
            "invisible group-hover/sidebar:visible transition-all duration-200 ease-in-out",
            collapsed && "rotate-180",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center px-4 py-5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={forskaleLogo}
              alt="ForSkale"
              className="h-16 w-16 flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            />
            {!collapsed && (
              <span className="whitespace-nowrap text-sm font-bold text-white tracking-wide">ForSkale</span>
            )}
          </div>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item);
            const classes = cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left no-underline",
              collapsed && "justify-center px-0",
              active
                ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground",
            );

            const content = (
              <>
                <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
                {!collapsed && <span>{item.label}</span>}
              </>
            );

            if (item.action || item.route) {
              return (
                <button key={item.label} className={classes} onClick={() => handleNavClick(item)}>
                  {content}
                </button>
              );
            }

            return item.href ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={classes}>
                {content}
              </a>
            ) : (
              <button key={item.label} className={classes}>
                {content}
              </button>
            );
          })}

          {/* Settings with hover submenu */}
          <div
            onMouseEnter={showSettings}
            onMouseLeave={hideSettings}
          >
            <button
              ref={settingsButtonRef}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left",
                collapsed && "justify-center px-0",
                isSettingsActive
                  ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                  : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground",
              )}
              aria-haspopup="true"
              aria-expanded={settingsOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  updateSubmenuPos();
                  setSettingsOpen((o) => !o);
                }
                if (e.key === "Escape") setSettingsOpen(false);
              }}
            >
              <Settings className={cn("h-5 w-5 flex-shrink-0", isSettingsActive && "text-white")} />
              {!collapsed && (
                <>
                  <span className="flex-1">Settings</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </>
              )}
            </button>
          </div>
        </nav>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        <div className="px-3 py-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <UserPlus className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Invite</span>}
          </button>
        </div>

        <div className="px-3 pb-4 pt-1">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
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

      {/* Settings submenu portal */}
      {settingsOpen && createPortal(
        <div
          ref={submenuRef}
          className="fixed z-[9999] min-w-[200px] rounded-lg border border-border/60 bg-card p-2 shadow-lg animate-scale-in"
          style={{ top: submenuPos.top, left: submenuPos.left }}
          onMouseEnter={showSettings}
          onMouseLeave={hideSettings}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") setSettingsOpen(false);
          }}
        >

          {settingsSubItems.map((sub, idx) => {
            const subActive = isActive(sub);
            const subClasses = cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left no-underline border border-border/40",
              subActive
                ? "bg-[hsl(var(--forskale-teal)/0.12)] text-foreground font-medium border-border/60"
                : "text-muted-foreground hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-foreground",
            );
            const subContent = (
              <>
                <sub.icon className="h-4 w-4 flex-shrink-0" />
                <span>{sub.label}</span>
              </>
            );

            if (sub.route) {
              return (
                <button key={sub.label} className={subClasses} onClick={() => handleSubItemClick(sub)} role="menuitem" style={{ animationDelay: `${idx * 50}ms` }}>
                  {subContent}
                </button>
              );
            }

            return sub.href ? (
              <a key={sub.label} href={sub.href} target="_blank" rel="noopener noreferrer" className={subClasses} role="menuitem" style={{ animationDelay: `${idx * 50}ms` }}>
                {subContent}
              </a>
            ) : (
              <button key={sub.label} className={subClasses} role="menuitem" style={{ animationDelay: `${idx * 50}ms` }}>
                {subContent}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      <StrategyModal isOpen={strategyModalOpen} onClose={() => setStrategyModalOpen(false)} />
    </>
  );
};

export default AppNavSidebar;
