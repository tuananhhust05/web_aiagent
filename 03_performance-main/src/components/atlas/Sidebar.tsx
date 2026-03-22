import { useState } from "react";
import {
  CalendarDays,
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  ChevronLeft,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/forskale-logo-2.png";

// Custom Record icon – a circle with inner filled dot
const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

const navItems = [
  {
    icon: CalendarDays,
    type: "link",
    label: "Meeting Intelligence",
    href: "https://preview--mockflow-artist.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJhYzAwNDUyNS03YTAwLTRjMDAtYjZhMC03OWUzYzIxY2JkYzciLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImFjMDA0NTI1LTdhMDAtNGMwMC1iNmEwLTc5ZTNjMjFjYmRjNyIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDEyOTcsIm5iZiI6MTc3MzEzNjQ5NywiaWF0IjoxNzczMTM2NDk3fQ.A0RfchOyUOGTyCuaL7t9lehtdGXh5ecH-ivR_5k9hmkh92bXDvxMjUXpyJLRbo2rpP2Fyib3UBeuiXPOosv8Py_R1rEtsLCHuuj7AxDnG_oQ7YfbGlDs-wgKv1EW0Hf88QfD-G8kifuHKiosBMlJsc9zXoOilxeO8ABeLQs8-pnoGu3bQWOZr0o0LUwLUDmgV07NlkKzBVjAYQX7PB-3In0CZxw5VQhG3UPlBh8KnR1dzsYLMQJECYuJw7Avr02Nl6UFQ01GPDriH846G1f_GafujagMBD1PNXT3EDoXq9dftemK1X_F1Hj9dRyAjeoQV_W-ji5eweUk-owTIG09Z4HnHZ5Cq1Z2_C8ghz39gcaddwlbzLwel7Wp_YqybeAkT_pGV1Sfb4N20rfg13KxOlJpAugCktXmG-HkUCFTpXIxcNCVOwq_MICPDrvmiS7bQq4MPsuJsaO2ff_bv1hDo8K_YbuIJ5NKBAaFDWDHQsUVd9hlXbSo5mamnwPAwb-jzgZH0r0jm-LrF6wdW_SjV70gA_Vt4zQ6CTli6fwmL2qY54Yd-CLI2gN1esQbLsubiGaeu0WoUirLT6aZmwUbEFwQPjLtSU6IliCcSpRa-0cgfaRqdQ8vExByCWd5DIQP_AbeEoj_zEr9ZukOljg_D1th6bCVTErKvs41qxxiPuo",
  },
  {
    type: "link",
    icon: Video,
    label: "Meeting Insights",
    href: "https://id-preview--4caf4962-dc30-4bfa-ba4f-8d8465cb538d.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiI0Y2FmNDk2Mi1kYzMwLTRiZmEtYmE0Zi04ZDg0NjVjYjUzOGQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjRjYWY0OTYyLWRjMzAtNGJmYS1iYTRmLThkODQ2NWNiNTM4ZCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDE2NDMsIm5iZiI6MTc3MzEzNjg0MywiaWF0IjoxNzczMTM2ODQzfQ.tBivpYnhgtzJU-ds8Ka7iDs1SbMDXQHdW-yE1YfLiA2vab9zOZ8z58VLv8cwW7y5mG1RrJG1tMgwodq0n_cSDtY_fm5xYe58xAESedk9LYG1NYD-HCyK_mbFPCsJO1-ktHa8dh0-Qcp2GN_NGHrdpuNg3Y8q82mBa6yMjr73WPpcU7KqralxC4MRZWYJylxVJAMgZp_DIVTeCgU7DQXbia1RAnqwpdVahxfO65iVrdqW8X7iWhrdnYmNGZHLtBG1tCmef2xCRMccMciH--mw8f0VAsdjDNNUKSKM3gyZhuf3eihMvWMRHk_n73kK3AIJAeev9U_1UOcjnbNFzxsz2-ABHXOH7gChKaPwzhcxgW54xHIUN6mx6exqe8uVWAL3kKu3taA6_Rus3lj_OhpLVVUwwVOwYHVhWayIU8tg__sxobcek0HZaNKIjWF9I3U7onmPvzhvxLgsEwmyNoNewFs_W_D8nYmtwggQ7gQDTOwFSQJxVb9o9MhHuXPbO13dyq8VpqGFaPSJS-FZDJe5vPp7w0u5S4_8VaHbtSF5wH8JcnlorPi63foPzh2kNLi1Q9a_FMldXTJRb8iE3aqUati9VirC6TU5lVci-nU5HdhjrbMkZAALScbf9FJJismUxDIHQUZ7R0wuTcCd9LsEp5Ua-rfY3G8WKpcgS0ls1OQ",
  },
  { label: "Performance", icon: BarChart3, active: true },
  {
    type: "link",
    icon: ClipboardCheck,
    label: "Action Ready",
    href: "https://id-preview--d1d293c4-947a-481b-95cc-f184c5294154.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJkMWQyOTNjNC05NDdhLTQ4MWItOTVjYy1mMTg0YzUyOTQxNTQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImQxZDI5M2M0LTk0N2EtNDgxYi05NWNjLWYxODRjNTI5NDE1NCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDEzMzAsIm5iZiI6MTc3MzEzNjUzMCwiaWF0IjoxNzczMTM2NTMwfQ.YIlf7slgRhr6rPFECas3OeGpVoNPnM9T-c4IdzqXCD9LEJ15ogJG7Da4ESToxWVK3CroAlsdYqwlCn9xwJqZNgANP1G2q50xY8EefkEX1-gMQt6dQoPpiG5HyFP5R2trPEF-oTrT9YzmaK1UTZjMRlnAywmrRrTfUGuvTBbRQX-Ld7okZldFVefZIiHR8yuIIhjAMo_VKoMgA3W2Ic-olLQihH1nMrFXJ0MzD9NtZ4450LZFgKC4MrzlldnUi6WuIBvSn1EU5dS6zvIzCnHre3BHgjHyZIeTnyauYUyeiLC5wgDmaMENX9oVqUcJeCiWHP2EvPK4ggYgr1HclO6ntGCX5tfxUdm-z3JV5TwrGDpJTZSzpPLSxHItAM7G5ZUwE6jgZUmQGT8CUK1gWWegCtILcNr1Ipq4nyv2EYbE_Wp4SlFmqNRWsGpEkRGp5gIZCdIXjhzVgTRgzpYFURHRu6zkAdeOZnOyqjPn0gdBsulAbJx1uhduIjT8ZO242HIINkS2eQVXJtED756G47bY5YQ8xDUxAJnv0oVGyovHpBYhtKH1DE8J-T3QbKcz0Bis5fDk1MWYVqpQ9C5XitJrmzW3v2CzAJajYksdQphejgmJDahXUI4_lT_6uIqrzmMxIogR75jJlTIAVJ8InVIAEN1Tu8J5XvKN0Ledl3jmddc",
  },
  {
    type: "link",
    icon: HelpCircle,
    label: "Q&A Engine",
    href: "https://id-preview--9e336b7f-4885-4309-abba-a0bc8bf87d2f.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWNlbU1Zd0FKSFJNb1FKUFh6STBDamg1QTVxMiIsInByb2plY3RfaWQiOiI5ZTMzNmI3Zi00ODg1LTQzMDktYWJiYS1hMGJjOGJmODdkMmYiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjllMzM2YjdmLTQ4ODUtNDMwOS1hYmJhLWEwYmM4YmY4N2QyZiIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDE1NjcsIm5iZiI6MTc3MzEzNjc2NywiaWF0IjoxNzczMTM2NzY3fQ.Jgv3uYOw4ImKaE0tSDzoSh4b5jtyYFc3xkFksZKdohpeplOZbQOIVxcWaxE7U93nPdDHJzjL860kknnfBDEkzy6oaLGgair4N4aDkouqxKiDzMrWIRDIcRfr6_lp6wRmX2QRVGDz2hCMIu3D3soF51F6fKfUjgvAHD4viV3vIyxCFzfkz2y310ZxZaDdsza_6qMDwMQqsjGIvwjF2npqp-99HbHov5XKpxCFTahtL36HEbbHm2s3yefpIsnqH4f5zprxVgEmW9vaWcKAxmlP28TbsEMjih2Kz6URfCUnSnT7FRetkEXrfoXjNZzOtMVCY8jq3ve-a394UwjLSR0QBlKtAuONCKlAXhIXoCS_zRffiElffx4y-qSapd5xpg0e21NAucW_zVbWqsj1_zEjBhoca9vz39Cjw0O5lA7C8gFa5RWPDI2ZGGdnbXI0wcSj_CaU28S0XAFWJoGCFozKGAHvWqqM-kSv3-sesOUQN_cEQzR-NHOy70oTIToLbPiEde7Up5wku_bq-Fc4juyG6dJovNDmVvV1N80-_w_es7WTGfgl9mB_emyU7GsVcAbo4tD74-M8KSLt7Vzjh_thQ9DH9J45FPvzF5reQzJUJhwflkYVvBpzs24r8oFFsQgLiT8lJC52r7-mpggbjxTbFOOZaZrU0y8od69yMzavyUQ",
  },
  {
    type: "link",
    icon: BookOpen,
    label: "Knowledge",
    href: "https://id-preview--be8e5a0c-8e6e-4c82-9fc9-68f5b7626ee0.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJiZThlNWEwYy04ZTZlLTRjODItOWZjOS02OGY1Yjc2MjZlZTAiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImJlOGU1YTBjLThlNmUtNGM4Mi05ZmM5LTY4ZjViNzYyNmVlMCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5ODg1MjgsIm5iZiI6MTc3MzM4MzcyOCwiaWF0IjoxNzczMzgzNzI4fQ.H02MHACdZPkGDim41DDoNNzZQpuNujfKNxxm0Y1L64JIqdpUgG7s-tF3oGFmXACt0QsxZ3jSkppSCkZafvJ7gjx-hp7-rAwRtbSx1emj8jagoYF_YyJ8I2q9Ii0gCgBfmOp1TBNUEA5UK53GKSDmdrJRw1UQ7u_0-OYx94UUVamJlYSEAqyosZs2okDMrvYXbkJ--Ggj4vNmfTed_0dmKPl8_VGeaCXaiYU064DTKjV56KQABFbnloZ48Jdsc1N-LxS_C1juWtRVcKD2ZwNDeAKFfOECryd0Hxwk6nMxEvs6kO5JjE5UCTa-sSGFpMT38N24R5wQ2EhtSKEg7HBup-9X0N50K8OqMdACeJYmZAd_8cmT6rFkduWp9KkP0H4wJrMOiolUc3jlf37429O7drTTv9Is1khgO5DOw_Vw6HSpe5wWLiosJc14B_S5nUKmQwHpZ_AcDs1SjlLwtB5dG83LwGivWG6xX3RcoJlXdxXapn8unkaejOlIQAHT__7mVMtZKZ25-WZeofzP6LSDBEOwL7rJUyBNSGJ-9k3Lm3MroU5Nb646kmkxfwlSlslnHf6pDZ-E-pLdn5FUGhEOIC7NoX6IYM37yeTd6Z02IzoEezK72pYnOadmhRo-QrJVSDuhWEY4GBIuuheG4aTsoU4tSDWQuoz6xlNBD9NG70E",
  },
  { label: "Record", icon: RecordIcon },
];

export function AtlasSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "group/sidebar relative flex flex-col shrink-0 transition-all duration-300 ease-in-out h-screen",
        "bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))]",
        "shadow-[4px_0_24px_rgba(0,0,0,0.25)] z-10",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute top-16 -right-4 z-40",
          "flex h-7 w-7 items-center justify-center rounded-full",
          "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
          "text-gray-500 hover:text-gray-800",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]",
          "transition-all duration-200 ease-in-out",
          "invisible group-hover/sidebar:visible",
        )}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
      </button>

      {/* Logo Header */}
      <div className="flex items-center px-4 py-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={logo}
            alt="ForSkale"
            className="h-16 w-16 flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
          />
          {!collapsed && <span className="whitespace-nowrap text-sm font-bold text-white tracking-wide">ForSkale</span>}
        </div>
      </div>

      {/* Gradient Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-1 px-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.type === "link" && item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full",
                  "transition-all duration-200 no-underline",
                  collapsed && "justify-center px-0",
                  item.active
                    ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                    : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5 flex-shrink-0", item.active ? "stroke-[2px] text-white" : "stroke-[1.6px]")}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </a>
            );
          }

          return (
            <button
              key={item.label}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-left",
                "transition-all duration-200 no-underline",
                collapsed && "justify-center px-0",
                item.active
                  ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                  : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn("h-5 w-5 flex-shrink-0", item.active ? "stroke-[2px] text-white" : "stroke-[1.6px]")}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Gradient Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Bottom Section */}
      <div className="px-3 pb-4 pt-3 space-y-2">
        {/* Invite Button */}
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
            "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            "transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <UserPlus className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Invite</span>}
        </button>

        {/* User Profile Card */}
        <div className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2", collapsed && "justify-center px-2")}>
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
  );
}
