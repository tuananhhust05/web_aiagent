export type Lang = "en" | "it" | "es";

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  it: "IT",
  es: "ES",
};

const translations = {
  // SignUp page
  signUpTitle: {
    en: "Sign up for ForSkale —",
    it: "Iscriviti a ForSkale —",
    es: "Regístrate en ForSkale —",
  },
  freeForever: {
    en: "free forever",
    it: "gratis per sempre",
    es: "gratis para siempre",
  },
  howCanHelp: {
    en: "How can ForSkale AI help?",
    it: "Come può aiutarti ForSkale AI?",
    es: "¿Cómo puede ayudarte ForSkale AI?",
  },
  verifyEmail: {
    en: "Verify your business email with Google or Microsoft",
    it: "Verifica la tua email aziendale con Google o Microsoft",
    es: "Verifica tu email empresarial con Google o Microsoft",
  },
  enterEmail: {
    en: "Enter email",
    it: "Inserisci email",
    es: "Ingresa tu email",
  },
  signUpFree: {
    en: "Sign up for free",
    it: "Iscriviti gratis",
    es: "Regístrate gratis",
  },
  or: {
    en: "or",
    it: "oppure",
    es: "o",
  },
  signUpGoogle: {
    en: "Sign up with Google",
    it: "Iscriviti con Google",
    es: "Regístrate con Google",
  },
  signUpMicrosoft: {
    en: "Sign up with Microsoft",
    it: "Iscriviti con Microsoft",
    es: "Regístrate con Microsoft",
  },
  termsAgree: {
    en: "By signing up, I agree to ForSkale's",
    it: "Registrandomi, accetto i",
    es: "Al registrarme, acepto los",
  },
  termsOfService: {
    en: "Terms of Service",
    it: "Termini di Servizio",
    es: "Términos de Servicio",
  },
  and: {
    en: "and",
    it: "e",
    es: "y",
  },
  privacyPolicy: {
    en: "Privacy Policy",
    it: "Informativa sulla Privacy",
    es: "Política de Privacidad",
  },
  alreadyAccount: {
    en: "Already have an account?",
    it: "Hai già un account?",
    es: "¿Ya tienes una cuenta?",
  },
  logIn: {
    en: "Log In",
    it: "Accedi",
    es: "Iniciar Sesión",
  },

  // Login page
  logInGoogle: {
    en: "Log In with Google",
    it: "Accedi con Google",
    es: "Iniciar sesión con Google",
  },
  logInMicrosoft: {
    en: "Log In with Microsoft",
    it: "Accedi con Microsoft",
    es: "Iniciar sesión con Microsoft",
  },
  signInApple: {
    en: "Sign in with Apple",
    it: "Accedi con Apple",
    es: "Iniciar sesión con Apple",
  },
  workEmail: {
    en: "Work Email",
    it: "Email di Lavoro",
    es: "Email de Trabajo",
  },
  password: {
    en: "Password",
    it: "Password",
    es: "Contraseña",
  },
  keepSignedIn: {
    en: "Keep me signed in",
    it: "Mantieni l'accesso",
    es: "Mantener sesión iniciada",
  },
  forgotPassword: {
    en: "Forgot password?",
    it: "Password dimenticata?",
    es: "¿Olvidaste tu contraseña?",
  },
  noAccount: {
    en: "Don't have an account?",
    it: "Non hai un account?",
    es: "¿No tienes una cuenta?",
  },
  signUp: {
    en: "Sign Up",
    it: "Registrati",
    es: "Regístrate",
  },

  // Left panel
  leftPanelTitle: {
    en: "Your AI Sales Executor",
    it: "Il tuo AI Sales Executor",
    es: "Tu AI Sales Executor",
  },
  leftPanelDesc: {
    en: "Neuroscience to understand people.\nAI to convert more opportunities into clients.",
    it: "Neuroscienze per capire le persone.\nAI per convertire più opportunità in clienti.",
    es: "Neurociencia para entender a las personas.\nIA para convertir más oportunidades en clientes.",
  },
  meetings: {
    en: "Meetings",
    it: "Meeting",
    es: "Reuniones",
  },
  neuroscience: {
    en: "Neuroscience",
    it: "Neuroscienze",
    es: "Neurociencia",
  },
  aiCoach: {
    en: "AI Coach",
    it: "AI Coach",
    es: "AI Coach",
  },
  loginLeftPanelNote: {
    en: "Top sales professionals use ForSkale to prepare better, close faster, and improve every day.",
    it: "I migliori professionisti delle vendite usano ForSkale per prepararsi meglio, chiudere più veloce e migliorare ogni giorno.",
    es: "Los mejores profesionales de ventas usan ForSkale para prepararse mejor, cerrar más rápido y mejorar cada día.",
  },

  // Forgot Password page
  forgotPasswordTitle: {
    en: "Forgot Password",
    it: "Password Dimenticata",
    es: "Olvidé mi Contraseña",
  },
  sendResetLink: {
    en: "Send Reset Link",
    it: "Invia Link di Reset",
    es: "Enviar Enlace de Restablecimiento",
  },
  rememberPassword: {
    en: "Remember your password?",
    it: "Ricordi la tua password?",
    es: "¿Recuerdas tu contraseña?",
  },
  signInHere: {
    en: "Sign in here",
    it: "Accedi qui",
    es: "Inicia sesión aquí",
  },
  backToLogin: {
    en: "Back to Login",
    it: "Torna al Login",
    es: "Volver al Login",
  },
  resetEmailSent: {
    en: "If an account exists for this email, we've sent a password reset link.",
    it: "Se esiste un account per questa email, abbiamo inviato un link per il reset della password.",
    es: "Si existe una cuenta para este email, hemos enviado un enlace para restablecer la contraseña.",
  },

  // Onboarding Step 0
  reviewPreferences: {
    en: "Please review your preferences",
    it: "Rivedi le tue preferenze",
    es: "Revisa tus preferencias",
  },
  autoRecord: {
    en: "Auto-record",
    it: "Registra automaticamente",
    es: "Grabar automáticamente",
  },
  andShareNotes: {
    en: "and share notes",
    it: "e condividi le note",
    es: "y comparte notas",
  },
  continue: {
    en: "Continue",
    it: "Continua",
    es: "Continuar",
  },
  skip: {
    en: "Skip",
    it: "Salta",
    es: "Omitir",
  },
  skipToAccountSetup: {
    en: "Skip to account setup",
    it: "Vai alla creazione account",
    es: "Ir a configurar la cuenta",
  },
  allMeetings: {
    en: "All meetings in my calendar",
    it: "Tutti i meeting nel mio calendario",
    es: "Todas las reuniones en mi calendario",
  },
  onlyExternal: {
    en: "Only external meetings",
    it: "Solo meeting esterni",
    es: "Solo reuniones externas",
  },
  dontAutomate: {
    en: "Don't automate, I'll record manually",
    it: "Non automatizzare, registrerò manualmente",
    es: "No automatizar, grabaré manualmente",
  },
  withAllParticipants: {
    en: "With all participants",
    it: "Con tutti i partecipanti",
    es: "Con todos los participantes",
  },
  onlyWithMe: {
    en: "Only with me",
    it: "Solo con me",
    es: "Solo conmigo",
  },
  selectOption: {
    en: "Select option",
    it: "Seleziona opzione",
    es: "Selecciona opción",
  },

  // Onboarding Step 1
  tellAboutYourself: {
    en: "Tell us about yourself",
    it: "Parlaci di te",
    es: "Cuéntanos sobre ti",
  },
  iMostlySpeak: {
    en: "I mostly speak",
    it: "Parlo principalmente",
    es: "Hablo principalmente",
  },
  inMeetings: {
    en: "in meetings.",
    it: "nei meeting.",
    es: "en reuniones.",
  },
  iWorkIn: {
    en: "I work in",
    it: "Lavoro in",
    es: "Trabajo en",
  },
  asA: {
    en: "as a",
    it: "come",
    es: "como",
  },
  inATeamOf: {
    en: ", in a team of",
    it: ", in un team di",
    es: ", en un equipo de",
  },
  companyWebsite: {
    en: "Company website",
    it: "Sito web aziendale",
    es: "Sitio web de la empresa",
  },
  companyWebsitePlaceholder: {
    en: "e.g., acme.com",
    it: "es., acme.com",
    es: "ej., acme.com",
  },
  companyWebsiteHelp: {
    en: "This helps us personalize your workspace.",
    it: "Questo ci aiuta a personalizzare il tuo spazio di lavoro.",
    es: "Esto nos ayuda a personalizar tu espacio de trabajo.",
  },
  noCompanyWebsite: {
    en: "No company website",
    it: "Nessun sito web aziendale",
    es: "Sin sitio web de la empresa",
  },
  iFoundForSkale: {
    en: "I found ForSkale through",
    it: "Ho trovato ForSkale tramite",
    es: "Encontré ForSkale a través de",
  },
  moreExactly: {
    en: ", more exactly",
    it: ", più precisamente",
    es: ", más exactamente",
  },
  pleaseSpecify: {
    en: "please specify",
    it: "specifica",
    es: "por favor especifica",
  },
  selectLanguage: {
    en: "Select language",
    it: "Seleziona lingua",
    es: "Selecciona idioma",
  },
  yourDepartment: {
    en: "Your department",
    it: "Il tuo dipartimento",
    es: "Tu departamento",
  },
  yourJobTitle: {
    en: "your job title",
    it: "il tuo ruolo",
    es: "tu cargo",
  },
  yourTeamSize: {
    en: "your team size",
    it: "dimensione del team",
    es: "tamaño del equipo",
  },
  howYouHeard: {
    en: "How you've heard of us",
    it: "Come ci hai conosciuto",
    es: "Cómo nos conociste",
  },

  // Onboarding Step 2
  question2of4: {
    en: "QUESTION 2 OF 4",
    it: "DOMANDA 2 DI 4",
    es: "PREGUNTA 2 DE 4",
  },
  howToStart: {
    en: "How do you want to start using ForSkale today?",
    it: "Come vuoi iniziare a usare ForSkale oggi?",
    es: "¿Cómo quieres empezar a usar ForSkale hoy?",
  },
  pickAsManyAsYouWant: {
    en: "Pick as many as you want. You'll still have access to everything—this just helps us guide your experience.",
    it: "Seleziona quanti ne vuoi. Avrai comunque accesso a tutto — questo ci aiuta a guidare la tua esperienza.",
    es: "Selecciona los que quieras. Seguirás teniendo acceso a todo — esto solo nos ayuda a guiar tu experiencia.",
  },
  selected: {
    en: "✓ Selected",
    it: "✓ Selezionato",
    es: "✓ Seleccionado",
  },
  select: {
    en: "Select",
    it: "Seleziona",
    es: "Seleccionar",
  },
  back: {
    en: "Back",
    it: "Indietro",
    es: "Atrás",
  },
  meetingIntelligence: {
    en: "Meeting Intelligence",
    it: "Intelligenza Meeting",
    es: "Inteligencia de Reuniones",
  },
  meetingIntelligenceSub: {
    en: "Analyze your sales calls automatically",
    it: "Analizza le tue chiamate di vendita automaticamente",
    es: "Analiza tus llamadas de ventas automáticamente",
  },
  meetingIntelligenceB1: {
    en: "AI transcription and summaries",
    it: "Trascrizione e riassunti AI",
    es: "Transcripción y resúmenes con IA",
  },
  meetingIntelligenceB2: {
    en: "Key insights from conversations",
    it: "Insight chiave dalle conversazioni",
    es: "Ideas clave de las conversaciones",
  },
  meetingIntelligenceB3: {
    en: "Detect objections, intent, and deal signals",
    it: "Rileva obiezioni, intenzioni e segnali di deal",
    es: "Detecta objeciones, intenciones y señales de cierre",
  },
  salesAssistance: {
    en: "Sales Assistance",
    it: "Assistenza Vendite",
    es: "Asistencia de Ventas",
  },
  salesAssistanceSub: {
    en: "Get AI strategy for your deals",
    it: "Ottieni strategie AI per i tuoi deal",
    es: "Obtén estrategia IA para tus acuerdos",
  },
  salesAssistanceB1: {
    en: "Understand deal stage and risks",
    it: "Comprendi la fase del deal e i rischi",
    es: "Comprende la etapa del acuerdo y los riesgos",
  },
  salesAssistanceB2: {
    en: "AI-generated strategic insights",
    it: "Insight strategici generati dall'AI",
    es: "Insights estratégicos generados por IA",
  },
  salesAssistanceB3: {
    en: "Suggested next steps for closing",
    it: "Prossimi passi suggeriti per la chiusura",
    es: "Próximos pasos sugeridos para el cierre",
  },
  actionReady: {
    en: "Action Ready",
    it: "Pronto all'Azione",
    es: "Listo para la Acción",
  },
  actionReadySub: {
    en: "Turn insights into actions",
    it: "Trasforma gli insight in azioni",
    es: "Convierte los insights en acciones",
  },
  actionReadyB1: {
    en: "AI-generated follow-ups",
    it: "Follow-up generati dall'AI",
    es: "Seguimientos generados por IA",
  },
  actionReadyB2: {
    en: "Email drafts and call scripts",
    it: "Bozze email e script di chiamata",
    es: "Borradores de email y guiones de llamada",
  },
  actionReadyB3: {
    en: "Task recommendations from meetings",
    it: "Raccomandazioni di task dai meeting",
    es: "Recomendaciones de tareas de las reuniones",
  },
  prospectIntelligence: {
    en: "Prospect Intelligence",
    it: "Intelligenza Prospect",
    es: "Inteligencia de Prospectos",
  },
  prospectIntelligenceSub: {
    en: "Understand your prospects instantly",
    it: "Comprendi i tuoi prospect istantaneamente",
    es: "Comprende a tus prospectos al instante",
  },
  prospectIntelligenceB1: {
    en: "LinkedIn enrichment",
    it: "Arricchimento LinkedIn",
    es: "Enriquecimiento de LinkedIn",
  },
  prospectIntelligenceB2: {
    en: "Personality insights",
    it: "Insight sulla personalità",
    es: "Insights de personalidad",
  },
  prospectIntelligenceB3: {
    en: "Communication strategy suggestions",
    it: "Suggerimenti strategia di comunicazione",
    es: "Sugerencias de estrategia de comunicación",
  },

  // Onboarding Step 3
  question3of4: {
    en: "QUESTION 3 OF 4",
    it: "DOMANDA 3 DI 4",
    es: "PREGUNTA 3 DE 4",
  },
  whichGoals: {
    en: "Which goals do you want to focus on here?",
    it: "Su quali obiettivi vuoi concentrarti?",
    es: "¿En qué objetivos quieres enfocarte?",
  },
  goalsHelp: {
    en: "What you pick helps set you up for success in ForSkale.",
    it: "Le tue scelte ci aiutano a prepararti al successo in ForSkale.",
    es: "Lo que elijas nos ayuda a prepararte para el éxito en ForSkale.",
  },
  goal1: {
    en: "Understand my sales calls better",
    it: "Capire meglio le mie chiamate di vendita",
    es: "Entender mejor mis llamadas de ventas",
  },
  goal2: {
    en: "Detect objections, intent, and buying signals",
    it: "Rilevare obiezioni, intenzioni e segnali d'acquisto",
    es: "Detectar objeciones, intenciones y señales de compra",
  },
  goal3: {
    en: "AI analysis of conversations",
    it: "Analisi AI delle conversazioni",
    es: "Análisis IA de conversaciones",
  },
  goal4: {
    en: "Improve my deal strategy",
    it: "Migliorare la mia strategia di deal",
    es: "Mejorar mi estrategia de acuerdos",
  },
  goal5: {
    en: "AI strategic insights for every meeting",
    it: "Insight strategici AI per ogni meeting",
    es: "Insights estratégicos IA para cada reunión",
  },
  goal6: {
    en: "Identify risks and opportunities",
    it: "Identificare rischi e opportunità",
    es: "Identificar riesgos y oportunidades",
  },
  goal7: {
    en: "Automate follow-ups after meetings",
    it: "Automatizzare i follow-up dopo i meeting",
    es: "Automatizar seguimientos después de reuniones",
  },
  goal8: {
    en: "AI-generated emails and next steps",
    it: "Email e prossimi passi generati dall'AI",
    es: "Emails y próximos pasos generados por IA",
  },
  goal9: { en: "Tasks created automatically", it: "Task creati automaticamente", es: "Tareas creadas automáticamente" },
  goal10: {
    en: "Prepare better for upcoming meetings",
    it: "Prepararmi meglio per i prossimi meeting",
    es: "Prepararme mejor para las próximas reuniones",
  },
  goal11: { en: "Prospect intelligence", it: "Intelligenza prospect", es: "Inteligencia de prospectos" },
  goal12: {
    en: "Suggested talking points",
    it: "Punti di discussione suggeriti",
    es: "Puntos de conversación sugeridos",
  },
  goal13: {
    en: "Train and coach my sales team",
    it: "Formare e fare coaching al mio team vendite",
    es: "Entrenar y hacer coaching a mi equipo de ventas",
  },

  // Onboarding Step 4
  question4of4: {
    en: "QUESTION 4 OF 4",
    it: "DOMANDA 4 DI 4",
    es: "PREGUNTA 4 DE 4",
  },
  howFamiliar: {
    en: "How familiar are you with tools like ForSkale?",
    it: "Quanto conosci strumenti come ForSkale?",
    es: "¿Qué tan familiarizado estás con herramientas como ForSkale?",
  },
  familiarityHelp: {
    en: "Your answer sets the right pace for getting started in ForSkale.",
    it: "La tua risposta imposta il ritmo giusto per iniziare con ForSkale.",
    es: "Tu respuesta establece el ritmo adecuado para comenzar en ForSkale.",
  },
  levelNew: {
    en: "I'm new to tools like this",
    it: "Sono nuovo a strumenti come questo",
    es: "Soy nuevo en herramientas como esta",
  },
  levelSome: {
    en: "I've used similar tools",
    it: "Ho usato strumenti simili",
    es: "He usado herramientas similares",
  },
  levelExperienced: {
    en: "I'm experienced",
    it: "Sono esperto",
    es: "Tengo experiencia",
  },
  continueToSetup: {
    en: "Enter the platform",
    it: "Entra nella piattaforma",
    es: "Entrar a la plataforma",
  },

  // Dropdown options
  onlyMe: { en: "Only me", it: "Solo io", es: "Solo yo" },
  team2to3: { en: "2-3", it: "2-3", es: "2-3" },
  team4to10: { en: "4-10", it: "4-10", es: "4-10" },
  team11to20: { en: "11-20", it: "11-20", es: "11-20" },
  team21to50: { en: "21-50", it: "21-50", es: "21-50" },
  teamOver50: { en: "50+", it: "50+", es: "50+" },
  referred: { en: "Referred", it: "Referral", es: "Referido" },
  searchEngine: { en: "Search Engine", it: "Motore di ricerca", es: "Motor de búsqueda" },
  socialMedia: { en: "Social Media", it: "Social Media", es: "Redes Sociales" },
  community: { en: "Community", it: "Community", es: "Comunidad" },
  other: { en: "Other", it: "Altro", es: "Otro" },

  // Departments
  deptSales: { en: "Sales", it: "Vendite", es: "Ventas" },
  deptHR: { en: "HR/Recruiting", it: "HR/Recruiting", es: "RRHH/Reclutamiento" },
  deptMarketing: { en: "Marketing", it: "Marketing", es: "Marketing" },
  deptStrategy: { en: "Strategy", it: "Strategia", es: "Estrategia" },
  deptOther: { en: "Other", it: "Altro", es: "Otro" },

  // Job titles - Sales
  jobSDR: {
    en: "Sales Development Rep / Business Development Rep",
    it: "Rappresentante Sviluppo Vendite / Business Development Rep",
    es: "Representante de Desarrollo de Ventas",
  },
  jobSalesExec: { en: "Sales Executive", it: "Responsabile Vendite", es: "Ejecutivo de Ventas" },
  jobMgrSalesOps: {
    en: "Sales Manager Operations",
    it: "Responsabile Operazioni Vendite",
    es: "Gerente de Operaciones de Ventas",
  },
  jobMgrSales: { en: "Sales Manager", it: "Responsabile Commerciale", es: "Gerente de Ventas" },
  jobSalesIntern: { en: "Sales Intern", it: "Stagista Vendite", es: "Pasante de Ventas" },
  jobOtherSales: { en: "Other", it: "Altro", es: "Otro" },

  // Job titles - HR
  jobRecruiter: { en: "Recruiter", it: "Selezionatore", es: "Reclutador" },
  jobTalent: {
    en: "Talent Acquisition Specialist",
    it: "Specialista Acquisizione Talenti",
    es: "Especialista en Adquisición de Talento",
  },
  jobHRManager: { en: "HR Manager", it: "Responsabile Risorse Umane", es: "Gerente de RRHH" },
  jobOtherHR: { en: "Other HR Roles", it: "Altri ruoli HR", es: "Otros roles de RRHH" },

  // Job titles - Marketing
  jobMktManager: { en: "Marketing Manager", it: "Responsabile Marketing", es: "Gerente de Marketing" },
  jobGrowth: { en: "Growth Marketer", it: "Esperto di Crescita", es: "Growth Marketer" },
  jobContent: { en: "Content Marketer", it: "Esperto di Contenuti", es: "Content Marketer" },
  jobOtherMkt: { en: "Other Marketing Roles", it: "Altri ruoli Marketing", es: "Otros roles de Marketing" },

  // Job titles - Strategy
  jobStrategyConsultant: { en: "Strategy Consultant", it: "Consulente Strategico", es: "Consultor de Estrategia" },
  jobBizDev: { en: "Business Development", it: "Sviluppo Business", es: "Desarrollo de Negocios" },
  jobStrategyManager: { en: "Strategy Manager", it: "Responsabile Strategia", es: "Gerente de Estrategia" },
  jobOtherStrategy: { en: "Other Strategy Roles", it: "Altri ruoli Strategia", es: "Otros roles de Estrategia" },

  // Job titles - Other
  jobFounder: { en: "Founder / Co-Founder", it: "Fondatore / Co-Fondatore", es: "Fundador / Cofundador" },
  jobCEO: { en: "CEO", it: "CEO", es: "CEO" },
  jobCOO: { en: "COO", it: "COO", es: "COO" },
  jobConsultant: { en: "Consultant", it: "Consulente", es: "Consultor" },
  jobAdvisor: { en: "Advisor", it: "Advisor", es: "Asesor" },
  jobFreelancer: { en: "Freelancer", it: "Freelancer", es: "Freelancer" },
  jobStudent: { en: "Student", it: "Studente", es: "Estudiante" },
  jobOther: { en: "Other", it: "Altro", es: "Otro" },

  // Meeting languages
  langEnUS: { en: "English (US)", it: "Inglese (US)", es: "Inglés (US)" },
  langEnAU: { en: "English (Australia)", it: "Inglese (Australia)", es: "Inglés (Australia)" },
  langEnIN: { en: "English (India)", it: "Inglese (India)", es: "Inglés (India)" },
  langEnGB: { en: "English (UK)", it: "Inglese (UK)", es: "Inglés (UK)" },
  langEsES: { en: "Spanish (Spain)", it: "Spagnolo (Spagna)", es: "Español (España)" },
  langEsMX: { en: "Spanish (Mexico)", it: "Spagnolo (Messico)", es: "Español (México)" },
  langItIT: { en: "Italian", it: "Italiano", es: "Italiano" },
  // Register step 2 + forgot/reset password
  setUpAccount: { en: "Set up your account", it: "Configura il tuo account", es: "Configura tu cuenta" },
  firstName: { en: "First name", it: "Nome", es: "Nombre" },
  firstNamePlaceholder: { en: "John", it: "Mario", es: "Juan" },
  lastName: { en: "Last name", it: "Cognome", es: "Apellido" },
  lastNamePlaceholder: { en: "Doe", it: "Rossi", es: "García" },
  confirmPassword: { en: "Confirm password", it: "Conferma password", es: "Confirmar contraseña" },
  createAccount: { en: "Create account", it: "Crea account", es: "Crear cuenta" },
  forgotPasswordDesc: { en: "Enter your email and we'll send you a reset link.", it: "Inserisci la tua email e ti invieremo un link di reset.", es: "Ingresa tu email y te enviaremos un enlace de restablecimiento." },
  checkYourEmail: { en: "Check your email", it: "Controlla la tua email", es: "Revisa tu correo" },
  resetLinkSent: { en: "We've sent a password reset link to your email. Check your inbox and follow the instructions.", it: "Abbiamo inviato un link di reset alla tua email.", es: "Hemos enviado un enlace de restablecimiento a tu email." },
  resetPasswordTitle: { en: "Reset your password", it: "Reimposta la tua password", es: "Restablecer tu contraseña" },
  resetPasswordDesc: { en: "Enter your new password below.", it: "Inserisci la tua nuova password.", es: "Ingresa tu nueva contraseña a continuación." },
  newPassword: { en: "New password", it: "Nuova password", es: "Nueva contraseña" },
  resetPasswordBtn: { en: "Reset password", it: "Reimposta password", es: "Restablecer contraseña" },
  passwordResetSuccess: { en: "Password reset successfully! Redirecting to login…", it: "Password reimpostata con successo!", es: "¡Contraseña restablecida exitosamente!" },
  invalidResetLink: { en: "Invalid or expired reset link.", it: "Link di reset non valido o scaduto.", es: "Enlace de restablecimiento inválido o expirado." },
  requestNewLink: { en: "Request new link", it: "Richiedi nuovo link", es: "Solicitar nuovo enlace" },
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey, lang: Lang): string => {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
};

export default translations;
