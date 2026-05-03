import { useState } from "react";
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
} from "lucide-react";
import forskaleLogo from "@/assets/forskale-logo.png";
import StrategyComingSoonModal from "./StrategyComingSoonModal";

/** Custom Record icon – outer ring + red inner dot */
const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

type NavItem = {
  icon: React.ComponentType<any>;
  label: string;
  key: string;
  href?: string;
  active?: boolean;
  action?: "strategy-modal";
};

const navItems: NavItem[] = [
  {
    icon: CalendarDays,
    label: "Meeting Intelligence",
    key: "meetingIntelligence",
    href: "https://preview--mockflow-artist.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJhYzAwNDUyNS03YTAwLTRjMDAtYjZhMC03OWUzYzIxY2JkYzciLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImFjMDA0NTI1LTdhMDAtNGMwMC1iNmEwLTc5ZTNjMjFjYmRjNyIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDEyOTcsIm5iZiI6MTc3MzEzNjQ5NywiaWF0IjoxNzczMTM2NDk3fQ.A0RfchOyUOGTyCuaL7t9lehtdGXh5ecH-ivR_5k9hmkh92bXDvxMjUXpyJLRbo2rpP2Fyib3UBeuiXPOosv8Py_R1rEtsLCHuuj7AxDnG_oQ7YfbGlDs-wgKv1EW0Hf88QfD-G8kifuHKiosBMlJsc9zXoOilxeO8ABeLQs8-pnoGu3bQWOZr0o0LUwLUDmgV07NlkKzBVjAYQX7PB-3In0CZxw5VQhG3UPlBh8KnR1dzsYLMQJECYuJw7Avr02Nl6UFQ01GPDriH846G1f_GafujagMBD1PNXT3EDoXq9dftemK1X_F1Hj9dRyAjeoQV_W-ji5eweUk-owTIG09Z4HnHZ5Cq1Z2_C8ghz39gcaddwlbzLwel7Wp_YqybeAkT_pGV1Sfb4N20rfg13KxOlJpAugCktXmG-HkUCFTpXIxcNCVOwq_MICPDrvmiS7bQq4MPsuJsaO2ff_bv1hDo8K_YbuIJ5NKBAaFDWDHQsUVd9hlXbSo5mamnwPAwb-jzgZH0r0jm-LrF6wdW_SjV70gA_Vt4zQ6CTli6fwmL2qY54Yd-CLI2gN1esQbLsubiGaeu0WoUirLT6aZmwUbEFwQPjLtSU6IliCcSpRa-0cgfaRqdQ8vExByCWd5DIQP_AbeEoj_zEr9ZukOljg_D1th6bCVTErKvs41qxxiPuo",
  },
  {
    icon: Video,
    label: "Meeting Insight",
    key: "meetingInsight",
    href: "https://id-preview--4caf4962-dc30-4bfa-ba4f-8d8465cb538d.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiI0Y2FmNDk2Mi1kYzMwLTRiZmEtYmE0Zi04ZDg0NjVjYjUzOGQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjRjYWY0OTYyLWRjMzAtNGJmYS1iYTRmLThkODQ2NWNiNTM4ZCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM3NDE2NDMsIm5iZiI6MTc3MzEzNjg0MywiaWF0IjoxNzczMTM2ODQzfQ.tBivpYnhgtzJU-ds8Ka7iDs1SbMDXQHdW-yE1YfLiA2vab9zOZ8z58VLv8cwW7y5mG1RrJG1tMgwodq0n_cSDtY_fm5xYe58xAESedk9LYG1NYD-HCyK_mbFPCsJO1-ktHa8dh0-Qcp2GN_NGHrdpuNg3Y8q82mBa6yMjr73WPpcU7KqralxC4MRZWYJylxVJAMgZp_DIVTeCgU7DQXbia1RAnqwpdVahxfO65iVrdqW8X7iWhrdnYmNGZHLtBG1tCmef2xCRMccMciH--mw8f0VAsdjDNNUKSKM3gyZhuf3eihMvWMRHk_n73kK3AIJAeev9U_1UOcjnbNFzxsz2-ABHXOH7gChKaPwzhcxgW54xHIUN6mx6exqe8uVWAL3kKu3taA6_Rus3lj_OhpLVVUwwVOwYHVhWayIU8tg__sxobcek0HZaNKIjWF9I3U7onmPvzhvxLgsEwmyNoNewFs_W_D8nYmtwggQ7gQDTOwFSQJxVb9o9MhHuXPbO13dyq8VpqGFaPSJS-FZDJe5vPp7w0u5S4_8VaHbtSF5wH8JcnlorPi63foPzh2kNLi1Q9a_FMldXTJRb8iE3aqUati9VirC6TU5lVci-nU5HdhjrbMkZAALScbf9FJJismUxDIHQUZ7R0wuTcCd9LsEp5Ua-rfY3G8WKpcgS0ls1OQ",
  },
  {
    icon: Target,
    label: "Strategy",
    key: "strategy",
    action: "strategy-modal",
  },
  { icon: ClipboardCheck, label: "Action Ready", key: "actionReady", active: true },
  {
    icon: HelpCircle,
    label: "QnA Engine",
    key: "qnaEngine",
    href: "https://id-preview--1815db0c-34d6-4ac8-b877-390e4cdeed22.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiIxODE1ZGIwYy0zNGQ2LTRhYzgtYjg3Ny0zOTBlNGNkZWVkMjIiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjE4MTVkYjBjLTM0ZDYtNGFjOC1iODc3LTM5MGU0Y2RlZWQyMiIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTc5OTcsIm5iZiI6MTc3MzM5MzE5NywiaWF0IjoxNzczMzkzMTk3fQ.SMZrtD6eWScnJVu_T2WmUS0hLAyLTmUmEDEHHBAH376uGQ0y2TFcZ_m6XsLRGP_DCLiDMun9rGp_LbYoOwyYAJMR0P1bwDFhZt9OXtmIPQPotjmkGMaurImtf_SFcD-kYJgCj5Gsulai68RVk2sOu06165QRq-HLF0FvNDzmZBy8JFeBNHnWjaVzO4Busl-CPWbYeM8VrbXa-frfs_ekVZqfZEy7I12UAbxnFOUzvmVUCL5Q_mtNgtIbfZCjlNePwPLG2GyQj_-fJNmuagQ9KuL5_NeZuW9fMNpoGtftUTaKoRsr8l1EelQpFwO1GUf_Fxb2mJS3r-yiw2UPMKeARrleebC5FCsk_dWYUOhGYhA9kep00shBesV_XS0RohUoMXnrLVeCrm-gfylGydNeblkef66Epz0JkilmBXHy6xwr36XuZhJu0MIXH-KmkmrxQI53Ua3TmTThJ6IMKTftd5FtSVJ8TGWqeO4L752nmPiotlwjrYoEeNN1_Q_O5QgFjdJgu_SkvPGBruG8_KdFVQnC-RjzwhKFXwsiGH5iQxN3gqVEARnG52xwPewTLiJ5xoz7UAeR5ofu5oAi9tLF-bi-Cp9Z2tCGuYq0AawFon0fl47uLz_dJiQybEkDffYYC_y-kNuKh89Ig2KCe9V2G5J3XkpNfqnwBEjt3gJqVac",
  },
  {
    icon: BarChart3,
    label: "Performance",
    key: "performance",
    href: "https://id-preview--e1b43afe-3952-4b3d-ada7-71a82ffd0d18.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJlMWI0M2FmZS0zOTUyLTRiM2QtYWRhNy03MWE4MmZmZDBkMTgiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImUxYjQzYWZlLTM5NTItNGIzZC1hZGE3LTcxYTgyZmZkMGQxOCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzUwMzY4MTEsIm5iZiI6MTc3NDQzMjAxMSwiaWF0IjoxNzc0NDMyMDExfQ.nplJQQL4_kEYFZwiukO-SA6Jz7a5wqeU_y5k2p99VVESQCS1hf50eN-abeWvUeojOATA_DIt97Y4HfAjSdpAwY5Cd5KJ4kkR9qLS2H43A_nm0KfOBV8OxcY1TBMmOriyJEsdRtfnvPck5aTFx5NH0EhfcAVjV3IEEfGJzqGU5_ILljOxANUbEKPdRBTly9T6wd1kDvUI_GAmP4KO7M1XhYoXsYETEqE4Wg3UEFTdCmG2I3-fPIaXHJreYqKwb6YgostcNuCyzEiEqLn7TTqIpBQIYTJDX4ORGkipGVrPmv2QYa-1a8Iu_jKe_xUAUxHcHe5edSz1t3U-ncDCoB6Rxzw6q9puiauz4cUDrfdrQitHwX83cwUdDVmSozogfC24Rz9uOIkZNY2VKNO2O63jEZAGSNusGP_svi51139XDcR9lvMog4yomdZt1mePPeqWpWRy2LhEUBOEVOfH8K5jDw_e5Njs83_jtUGnVVpUQ_3eaLwgFzMMK64CQznZi28MftnOKYudTL5t_crMvF_-y2-76KQwAfdCWJFfXK1yw2hUxFkIrUc6tFTNM4brIMl8HPXR8PV9DWCXBEDufGoua9A1W0tndd0t12ZreMuuUN759riGdkn0y02Fns7dndwtv3AW9gvkZuUAf65VC5YzpGf9UAJ7WhrOX2RM7Chb8dc",
  },
  {
    icon: BookOpen,
    label: "Knowledge",
    key: "knowledge",
    href: "https://id-preview--1815db0c-34d6-4ac8-b877-390e4cdeed22.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiIxODE1ZGIwYy0zNGQ2LTRhYzgtYjg3Ny0zOTBlNGNkZWVkMjIiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjE4MTVkYjBjLTM0ZDYtNGFjOC1iODc3LTM5MGU0Y2RlZWQyMiIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzM5OTc2NDksIm5iZiI6MTc3MzM5Mjg0OSwiaWF0IjoxNzczMzkyODQ5fQ.B3NClcBb3qdJOWylfTJnXgFAeRtjtiLir59v-RPRM517RdZDgf_ek_jVnQjl4OL0e7DbjE9Uwk60FQsJz-UKLUvUXOADynqwDVxB6SS1__WFd2x7h6Z4Nw817pjGDPKsvL-t6t0C-psSkO1Atld8XyZu19Vuxw15rZnZ49u9n67eX8C769FqNpDDfLLQVwH-ldpgsS3B8hwWzZDVXb5z8my_nCvJqSdItkYI3pSVLemHv8ljRCKxf-pzebk5YwEXBqlA0MMhRDybHsA7uxHOTyN6PwpCZDqZag7duw_zSBGY3ZTir1Ee2HJfyetHjLinXeGUbS7evMEEEIgDTrmdrcr53EGyU4VDF8EQbbNWggRbWZ2j8P-mj_E3b8ScNDzGg3AxIGOMAblO5eEmWU3jtDJI6XtLn73ivgPKVF3VIkwU7_EvQIg5A80tTyyeHSNwfz9eY5DjTE7AMRoHZtgiBYbXu7OqkE7d0dqP0eMHSzZlI_UCbx_ZOexWeowDTjYDI6jLKU5kKtjHWl84xUDq6kk5yXI9939hBa3NHfRimcQYeDH1P7MUP5rwt1Mo7gQZZgdRZFqIn5v4zPV5i1wD9MzSIHQ2c4ob3jiGBCuiw2_jw6i-7UrkNWftgHKwVv6z7La8Ors2JfeYBGsJkES2UwaP7SZ4aZPkhvzdGwHo-qs",
  },
  {
    icon: RecordIcon,
    label: "Record",
    key: "record",
    href: "https://id-preview--bd05911a-d8fd-4ab9-aaa7-333d630b922e.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNDNGMU9jVjM1cWRWWVV0TVJkMWVnWktlTjVXMiIsInByb2plY3RfaWQiOiJiZDA1OTExYS1kOGZkLTRhYjktYWFhNy0zMzNkNjMwYjkyMmUiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImJkMDU5MTFhLWQ4ZmQtNGFiOS1hYWE3LTMzM2Q2MzBiOTIyZSIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzUwNDEyNjYsIm5iZiI6MTc3NDQzNjQ2NiwiaWF0IjoxNzc0NDM2NDY2fQ.Nf1-O0lsF3Zbbh1uvvE_EP9TxCYxLDiVSI8Zxl8YC5k38xkHmb_ZgzLXcrjlVgDvr7Oj-Mjpjv_HkVWlbomjqlbmqp1g9B6OuqgOOVCbFvq8VNZDWOmdH17Te3YHwmbsxhhU_BghMp8mM86KsfkLzdpRbxOrsgKUlVNPk4cXGtZ_3qYkHWuz6plVrHWJpKaWgfQh6qN-vA5rB2pr6R8035GXjRNYAp2AidzS1qBj0DSM8CnqCD55ZTrfpf0dYyoin1qfwYFBO8pJdvDQPOmjKIWzakHUgYj6ezJJT3eWfaWFK_vsRgdAgqqyUH6sZcLRKtLHpKs5qczxKVju514PdgB3S7TJoJhGG-lnGnexVRhi8UOmRyAoA9U4P8i3D1F1wjXD1zdOeoiij5i_WaaKLMZ3fk17N5X1qGPeGyWfmsdAJ_r_sezdNMAZNH0XKGExMsvCnf5YIDcqzcy9ERAL2qrSMsWLH96LnA8cxkguLRxwMhtJCLSjl99nHqczVGxPLkbYVazi62YFEArCr7CA6hdPGmfFy3Y457B0TstbiDQx6UmSEzNJGjmd0IJdPBo1y5gs9nfV9xsitPqRpMMcuy2gCqtYfIDL92QLyPHGYwVSPe7Q_MGZk90Al47IPuiYvhWreFf90qHVE7OQxyYnjLpGnx71mP1bgoSJ5Juk6A0",
  },
];

const AtlasSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  

  return (
    <>
      <aside
        className={`group/sidebar relative hidden min-h-screen flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 ease-in-out lg:flex ${
          collapsed ? "w-[72px]" : "w-60"
        }`}
      >
        {/* Logo Header with Integrated Toggle */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={forskaleLogo}
              alt="ForSkale"
              className="h-16 w-16 flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            />
            {!collapsed && (
              <span className="whitespace-nowrap text-sm font-bold tracking-wide text-white">ForSkale</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-sidebar-foreground/70 hover:bg-white/10 hover:text-white transition-all duration-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Gradient divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
          {navItems.map((item) => {
            const label = item.label;
            const classes = `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm no-underline transition-all duration-200 ${
              collapsed ? "justify-center px-0" : ""
            } ${
              item.active
                ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground"
            }`;

            const content = (
              <>
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={item.active ? 2 : 1.6} />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            );

            if (item.action === "strategy-modal") {
              return (
                <button
                  key={item.key}
                  className={`${classes} w-full`}
                  title={label}
                  onClick={() => setStrategyModalOpen(true)}
                >
                  {content}
                </button>
              );
            }

            return item.href ? (
              <a key={item.key} href={item.href} target="_self" className={classes} title={label}>
                {content}
              </a>
            ) : (
              <button key={item.key} className={`${classes} w-full`} title={label}>
                {content}
              </button>
            );
          })}
        </nav>

        {/* Gradient divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        {/* Invite button */}
        <div className="px-3 py-3">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <UserPlus className="h-5 w-5 flex-shrink-0" strokeWidth={1.6} />
            {!collapsed && <span>Invite</span>}
          </button>
        </div>

        {/* User Profile Card */}
        <div className={`px-3 pb-4 ${collapsed ? "flex justify-center" : ""}`}>
          <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${collapsed ? "px-0" : ""}`}>
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

      <StrategyComingSoonModal open={strategyModalOpen} onOpenChange={setStrategyModalOpen} />
    </>
  );
};

export default AtlasSidebar;
