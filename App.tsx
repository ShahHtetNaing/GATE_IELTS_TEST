import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  Mic, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  BarChart, 
  Clock, 
  ChevronRight,
  RefreshCcw,
  Loader2,
  FileText,
  Video,
  Award,
  Book,
  X,
  Search,
  Lightbulb
} from 'lucide-react';
import { AppState, Skill, TestContext, UserResponse, TestResult } from './types';
import * as GeminiService from './services/geminiService';

// --- Shared Components ---

const Header = ({ currentView, onNavigate }: { currentView: string, onNavigate: (view: AppState['view']) => void }) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <button 
        onClick={() => onNavigate('home')} 
        className="flex items-center gap-2 hover:opacity-80 transition focus:outline-none"
      >
        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold">G</div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">GATE <span className="text-slate-400 font-normal">| IELTS Prep</span></span>
      </button>
      <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-600">
        {[
          { id: 'home', label: 'Dashboard' },
          { id: 'history', label: 'History' },
          { id: 'resources', label: 'Resources' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={`px-4 py-2 rounded-lg transition ${
              currentView === item.id 
                ? 'bg-blue-50 text-blue-700' 
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  </header>
);

const SkillCard = ({ 
  icon: Icon, 
  title, 
  desc, 
  color, 
  onClick 
}: { 
  icon: any, 
  title: string, 
  desc: string, 
  color: string, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left w-full h-full flex flex-col"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className="text-white w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-grow">{desc}</p>
    <div className="flex items-center text-blue-600 font-medium text-sm mt-auto">
      Start Simulation <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
    <h2 className="text-xl font-semibold text-slate-800 animate-pulse">{message}</h2>
    <p className="text-slate-500 mt-2 text-sm">Powered by Gemini AI</p>
  </div>
);

// --- Data ---
const WORD_LISTS = {
  "List 1": [
    "achieve", "administration", "affect", "analysis", "approach", "appropriate", "area", "aspects", "assistance", "assume", 
    "authority", "available", "benefit", "category", "community", "complex", "concerning", "conclusion", "conduct", "consequence", 
    "consistent", "constitutional", "consumer", "context", "create", "culture", "data", "definition", "destructive", "discovery", 
    "distinction", "economic", "element", "environment", "error", "equation", "establish", "estimate", "evaluation", "evidence", 
    "factors", "feature", "final", "financial", "focus", "function", "global", "identify", "impact", "income", 
    "indicate", "individual", "injury", "investment", "involve", "issue", "item", "legal", "maintenance", "major", 
    "media", "method", "modern", "normal", "obtain", "restrict", "occur", "participation", "percent", "period", 
    "policy", "positive", "potential", "previous", "primary", "process", "purchase", "range", "recent", "region", 
    "regulations", "relevant", "require", "research", "resident", "resources", "response", "sector", "security", "significant", 
    "similar", "solution", "source", "specific", "strategy", "structure", "theory", "threat", "traditional", "transport"
  ],
  "List 2": [
    "access", "activity", "alter", "alternative", "amendment", "annual", "apparent", "application", "approximate", "artificial", 
    "attitude", "aware", "capacity", "challenge", "circumstance", "comment", "communication", "concentration", "conflict", "considerable", 
    "constant", "contact", "contribution", "core", "correspond", "criteria", "cycle", "debate", "decline", "deduction", 
    "demonstrate", "despite", "dimension", "domestic", "dominant", "emerge", "emphasis", "enable", "energy", "enforcement", 
    "ensure", "equivalent", "evolution", "exclude", "exposure", "external", "facilitate", "fundamental", "funds", "generation", 
    "hence", "hypothesis", "illustrate", "image", "immigration", "implement", "initial", "integration", "layer", "legislation", 
    "location", "logic", "marginal", "maximum", "mechanism", "medical", "mental", "modification", "negative", "network", 
    "occupation", "option", "orientation", "outcome", "overall", "parallel", "perspective", "philosophy", "precise", "predict", 
    "project", "promote", "proportion", "psychology", "reaction", "remove", "resolution", "specify", "stability", "subsequent", 
    "sufficient", "summary", "supply", "task", "technique", "technology", "transition", "trend", "version", "volume"
  ],
  "List 3": [
    "abstract", "accurate", "acknowledge", "adaptation", "adequate", "adjust", "adult", "advocate", "aid", "attribute", 
    "author", "brief", "capable", "civil", "classical", "comprehensive", "contrary", "coordination", "couple", "decades", 
    "definite", "deny", "discrimination", "disposal", "diversity", "domain", "dynamic", "eliminate", "equipment", "estate", 
    "exceed", "expansion", "expert", "fees", "flexibility", "foundation", "gender", "global", "grade", "guarantee", 
    "identical", "ignorance", "imply", "incentive", "incorporated", "index", "infrastructure", "inhibition", "innovation", "instance", 
    "instruction", "intelligence", "interact", "interval", "investigation", "isolated", "justification", "lecture", "liberal", "migration", 
    "minimum", "monitoring", "motivation", "neutral", "obvious", "overseas", "parameter", "phenomenon", "prohibit", "publish", 
    "pursue", "rational", "recovery", "reject", "release", "reveal", "role", "satisfy", "scope", "sequence", "simulation", 
    "solely", "somewhat", "status", "stress", "style", "substitution", "successive", "survey", "survive", "sustainable", "symbolic", 
    "topic", "trace", "transformation", "ultimate", "underline", "unique", "utility", "visible"
  ],
  "List 4": [
    "accommodation", "accompany", "advance", "analogous", "anticipate", "appendix", "appreciate", "arbitrary", "assure", "automatically", 
    "behalf", "bias", "cease", "chart", "clarity", "coherence", "coincide", "commodity", "confirm", "contemporary", 
    "contradict", "controversy", "conversely", "cooperate", "crucial", "currency", "denote", "detect", "deviation", "device", 
    "devote", "differentiation", "diminish", "displacement", "display", "distorted", "dramatic", "duration", "ethical", "eventually", 
    "exhibit", "explicit", "exploitation", "extract", "federal", "fluctuations", "format", "founded", "guidelines", "highlighted", 
    "implicit", "incompatible", "induce", "inevitably", "inherent", "intensity", "intermediate", "internal", "manual", "mature", 
    "medium", "military", "mutual", "norms", "notion", "nuclear", "objective", "paragraph", "passive", "perceive", 
    "portion", "precede", "predominantly", "priority", "prospect", "qualitative", "radical", "random", "reinforce", "relax", 
    "revision", "revolution", "scenario", "schedule", "sphere", "suspended", "target", "team", "temporary", "tension", 
    "theme", "thereby", "uniform", "validity", "vehicle", "via", "violation", "virtual", "vision", "widespread"
  ],
  "List 5": [
    "abandon", "abate", "abrupt", "accumulation", "acquisition", "adjacent", "aggregate", "albeit", "ambiguous", "ancestor", 
    "assembly", "assessment", "assign", "attain", "avert", "coal", "collapse", "colleagues", "combat", "commit", 
    "compile", "complement", "comprise", "conceive", "concurrent", "confined", "conform", "confuse", "consciousness", "convinced", 
    "creditable", "deceive", "depression", "derive", "distribution", "divergent", "doubt", "drastic", "election", "empirical", 
    "encounter", "enhance", "enormous", "entirely", "entrepreneur", "erosion", "forbearance", "forthcoming", "frustration", "goal", 
    "homogenous", "inclination", "indulge", "infer", "initiative", "insight", "inspection", "integral", "intervention", "intrinsic", 
    "invoke", "justify", "likewise", "link", "manage", "manipulation", "merge", "nonetheless", "notwithstanding", "odd", 
    "ongoing", "overlap", "persistent", "pose", "possess", "preliminary", "presumption", "ratio", "refine", "relate", 
    "reluctant", "restore", "restraint", "rigid", "route", "sacrifice", "scale", "so-called", "straightforward", "subordinate", "substantiate", 
    "supplementary", "sympathy", "termination", "transmission", "undergo", "unify", "vital", "voluntary", "whereby"
  ]
};

const ESSAY_SAMPLES = [
  {
    id: 1,
    question: "Should a city try to preserve its old, historic buildings or destroy them and replace them with modern buildings? Use specific reasons and examples to support your opinion.",
    answer: "Whether cities should preserve historic buildings or demolish them to make space for modern developments is a topic of considerable debate. I strongly believe that maintaining old structures is far more beneficial, as they carry cultural value and can bring long-term economic advantages.\n\nOne major reason to preserve historic buildings is that they represent a city’s cultural identity. These structures reflect architectural styles, traditions and significant events from different periods of history. When cities destroy them, they risk losing part of their heritage that cannot be replaced. For example, many European cities, such as Rome and Prague, attract millions of visitors every year precisely because they have maintained their historic centres. These buildings create a unique atmosphere that modern skyscrapers cannot replicate. Therefore, preserving old architecture helps maintain a sense of continuity and identity for future generations.\n\nAnother strong argument for preservation is the economic value that historic sites generate. Tourism is one of the largest global industries, and travellers often choose destinations based on their cultural and historical attractions. Renovating old buildings and converting them into museums, hotels or cultural centres not only protects heritage but also supports local businesses and creates employment. Additionally, many historic buildings are structurally sound and can be modernised internally, making them both functional and environmentally sustainable. In contrast, demolishing structures and constructing new ones often requires far more energy and resources, contributing to environmental waste.\n\nIn conclusion, cities should prioritise the preservation of historic buildings because they provide cultural identity and long-term economic benefits. While modern development is important, it should not come at the expense of irreplaceable heritage that enriches both local residents and visitors."
  },
  {
    id: 2,
    question: "An increasing number of schools provide tablets and laptop computers for students to use in school, replacing books and other printed materials like exams and assignments. What are the advantages and disadvantages of this trend?",
    answer: "It is argued that untouched lands must be investigated because of the increasing necessity for energy sources worldwide. This essay totally disagrees with this statement. I believe that exploring new areas in order to gain access to oil and gas can have detrimental impacts on the environment and cause more dependency on fossil fuels.\n\nExploring new territories for fossil-gaining purposes can worsen significantly the biodiversity of the Earth. Aspiring to acquire temporary power resources, a vast landscape must be destroyed, chopping down the hectares of wood and releasing hazardous gas emissions into the atmosphere. Furthermore, it may cause other catastrophic issues such as Global warming, by depriving remaining trees on the Earth and increasing air pollution. For example, provided statistics by Nazarbayev University exploiting lands excessively between 1970 and 1996, Kazakhstan's climate worsened by 35% by degrading air quality and causing the extinction of local species of fauna and flora.\n\nHaving exploited fossil fuels from undeveloped areas, citizens can grow their dependency by trying to accomplish urgent necessities. Not only does the exploration of new lands make people eager to consume increasingly year by year, but it also may lead to a neglectful approach to the environment. Instead of inventing and implementing eco-friendly sustainable energy, humans generally rush to find a temporary salvation. For instance, a study conducted by the World Nature Conservancy proves that the opening of new gas and oil fields is gaining a tendency, with an increasing figure at about 9% each year, and causing the neglection to the invention of alternative power sources.\n\nIn conclusion, though the demand for traditional energy resources is growing, it mustn't be the reason to exploit undeveloped areas, as this can become a root of disaster to the nature and reliance of humanity only on these sources."
  },
  {
    id: 3,
    question: "Some people believe that planning for the future is a waste of time because they think that focusing on the present is more important. To what extent do you agree or disagree.",
    answer: "It is argued that making arrangements for the future is useless as focusing on your current life is more crucial. This essay totally disagrees with that statement. I believe that planning helps people to achieve long-term success and prevent potential unexpected risks.\n\nIndividuals with planned future actions are capable of achieving heights down the line. Not only do they aspire to employ all the opportunities they have to accomplish goals, but they can also take control over their present actions. Ambitions with organised steps lead to personal growth and fulfilment. For example, provided statistics by Harvard University show that students with a prearranged future exhibited advancements in their physical, emotional, financial and social spheres 45% higher than those without certain purposes.\n\nAdditionally, when they organise their way of life, it will provide a chance to notice and avert possible challenges or negative changes in the distant horizon. By taking a proactive approach to their lifestyle, humans can maintain the required daily routines, skills and strategic thinking in the present moment. Furthermore, it assists in acquiring a mindful and rational mindset towards life changes. For instance, according to a study conducted by the scientists of the International Organisation For Human Resources, individuals with desired accomplishments are 23% less likely to have unpleasant outcomes. Even though they encounter difficulties, they probably will not cause them as high a level of stress and anxiety as the other group.\n\nIn conclusion, being purposeful in terms of their forthcoming plans can result in outstanding results for people and mitigate unanticipated threats on their further path."
  },
  {
    id: 4,
    question: "Some people think that government funding for schools should be spent on science subjects rather than on other subjects. To what extent do you agree or disagree?",
    answer: "There is no denying that governments should allocate funds to education. Some people look upon expenditures spent on science as a better policy, compared to other subjects. As far as I am concerned, I am strongly opposed to this argument, and the reasons will be thoroughly explained as follows.\n\nTo begin with, not all students are interested in science, so some groups of people will be treated unfairly if the authorities fail to spend money on diverse subjects. That is to say, those who are passionate about other fields like arts or literature will be underserved. For example, I have been dreaming about pursuing a career as a professional dancer since I was a child. However, decades ago, the Taiwanese government implemented regulations that maintained financial support only for science and technology subjects. As a result, I had no option but to give up my aspiration due to lacking enough savings for further advanced training lessons.\n\nIt is widely accepted that individuals tend to select a major catering to the job market; therefore, there is a risk of an imbalance in human resources in the future. According to a study from National Taiwan University, about 70 per cent of job opportunities in Taiwan are related to semiconductors and software services, which results in the majority of Taiwanese teenagers preferring to learn physics, mathematics, and programming. On the other hand, businesses like publishers or restaurants are now facing challenges in not being able to hire enough well-trained employees.\n\nIn conclusion, based on the aforementioned, funding for schools should be distributed to various subjects for the sake of benefiting every student and protecting every business."
  },
  {
    id: 5,
    question: "Schools are no longer necessary, because children can get so much information available through Internet, and they can study just as well at home. What extent do you agree or disagree?",
    answer: "In this modern world, whether or not the existence of schools is necessary has been a widely debated issue. Some people believe that schools are no longer a must due to the prevalence of the Internet nowadays. In this essay, I will explain why I strongly disagree with this statement.\n\nAlthough being able to acquire information through the Internet, children might be addicted to video games or social media, both of which distract their studies badly. Some of them even suffer from eye strain and nearsightedness because of prolonged use of screens without taking breaks properly. Last but not least, the majority of children tend to develop a sedentary lifestyle, causing them to risk chronic diseases such as obesity and hypertension. In contrast, schools typically have strict regulations regarding surfing the Internet and courses requiring students to do outdoor exercises, so the above concerns can be easily solved.\n\nBesides learning knowledge, schools provide other basic educational resources to children in my opinion. First of all, when individuals are involved in group activities or discussions, they will learn about communication skills, teamwork abilities, and time management. In addition, only teachers, instead of computers, can address students' learning problems and inspire them to build confidence to face the challenges. Also, children sometimes have questions about their future careers, and suggestions from teachers are much more meaningful than anonymous Internet users.\n\nIn conclusion, even if the Internet enables people to learn on their own, I believe that schools still play a crucial role in society and are necessary for providing social experiences and guiding mentors."
  },
  {
    id: 6,
    question: "Some people think that to lead a successful life, a university degree is important. Others believe that this is no longer true nowadays. Discuss both views and give your opinion.",
    answer: "In our modern era, some people hold the view that to guarantee a prosperous career and stable life, a degree is needed. While other folks believe that in recent generations, success in life can be achieved in multiple ways and forms. In this essay, I will discuss each perspective and give my opinion.\n\nOn the one hand, there are specific fields that need degrees to succeed, such as medicine, engineering, law, and so on. Therefore, to achieve greatness in these domains, a person should have a major in college and study for it to be able to join these categories in the first place. For example, to become a doctor, studies show that completing a medical degree and passing a licensing exam is essential for practising medicine.\n\nOn the other hand, a successful career is not confined to studying or having degrees in our modern generation. This is because when a person launches a brand or starts a business, they can rely on their dedication, creativity, hard work, and vision to project management and lead to a successful business. Thereby, these types of fields don't require professional titles to thrive as much as they require mental abilities and innovative thinking. To illustrate, recent studies have shown that most of the successful rich people build their careers on businesses and companies they created, even though their major in college was completely different from business.\n\nTo sum up, I personally believe that to build a life of achievement, a formal education is not needed in a number of ways, like managing projects or establishing a personal brand. However, there are some domains that require an academic qualification to create a fruitful professional path."
  }
];

// --- View Components ---

const HomeView = ({ onSelect }: { onSelect: (s: Skill) => void }) => (
  <div className="max-w-5xl mx-auto px-4 py-12">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
        Master the IELTS
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        Realistic simulations powered by AI. Get instant, detailed feedback and band score estimates for Academic IELTS.
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SkillCard 
        icon={Headphones} 
        title="Listening" 
        desc="Test your comprehension of monologues and conversations in academic contexts." 
        color="bg-indigo-500"
        onClick={() => onSelect('listening')}
      />
      <SkillCard 
        icon={BookOpen} 
        title="Reading" 
        desc="Analyze complex academic texts and answer detailed questions." 
        color="bg-emerald-500"
        onClick={() => onSelect('reading')}
      />
      <SkillCard 
        icon={PenTool} 
        title="Writing" 
        desc="Practice Task 1 (Data Description) and Task 2 (Essay) with instant grading." 
        color="bg-rose-500"
        onClick={() => onSelect('writing')}
      />
      <SkillCard 
        icon={Mic} 
        title="Speaking" 
        desc="Simulate a live interview covering Part 1, 2, and 3." 
        color="bg-amber-500"
        onClick={() => onSelect('speaking')}
      />
    </div>
  </div>
);

const HistoryView = ({ onBack }: { onBack: () => void }) => (
  <div className="max-w-5xl mx-auto px-4 py-12">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-bold text-slate-900">Test History</h2>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">No tests completed yet</h3>
      <p className="text-slate-500 max-w-md mx-auto mb-6">Your completed simulations and band scores will appear here. Start a simulation to get your first score.</p>
      <button onClick={onBack} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
        Start a Test
      </button>
    </div>
  </div>
);

const ResourcesView = ({ onOpenVocabulary, onOpenEssays }: { onOpenVocabulary: () => void, onOpenEssays: () => void }) => {
  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Study Resources</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <button 
          onClick={() => openLink("https://drive.google.com/file/d/1vYJWGSMmzCmkPLhNezfzufDLnobk50kc/view?usp=sharing")}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group w-full"
        >
           <div className="w-10 h-10 bg-blue-500 rounded-lg mb-4 flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
           </div>
           <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition">Official IELTS Guide</h3>
           <p className="text-sm text-slate-500">PDF Guide</p>
        </button>

        <button 
          onClick={onOpenVocabulary}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group w-full"
        >
           <div className="w-10 h-10 bg-emerald-500 rounded-lg mb-4 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
           </div>
           <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition">Academic Vocabulary</h3>
           <p className="text-sm text-slate-500">Word List 1-5</p>
        </button>

        <button 
          onClick={onOpenEssays}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group w-full"
        >
           <div className="w-10 h-10 bg-purple-500 rounded-lg mb-4 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-white" />
           </div>
           <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition">Band 9 Essay Samples</h3>
           <p className="text-sm text-slate-500">Writing Samples & Analysis</p>
        </button>

        {[
          { 
            title: "Speaking Cue Cards", 
            type: "Topics & Sample Answers", 
            url: "https://leapscholar.com/blog/ielts-speaking-cue-cards-topics-sample-answers/", 
            color: "bg-amber-500", 
            icon: Mic 
          },
          { 
            title: "Listening Tricks & Tests", 
            type: "British Council Practice", 
            url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/listening", 
            color: "bg-rose-500", 
            icon: Headphones 
          },
          { 
            title: "Reading Techniques & Tests", 
            type: "British Council Practice", 
            url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading", 
            color: "bg-indigo-500", 
            icon: BookOpen 
          },
        ].map((r, i) => (
          <button 
            key={i} 
            onClick={() => openLink(r.url)}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group w-full"
          >
            <div className={`w-10 h-10 ${r.color} rounded-lg mb-4 flex items-center justify-center`}>
              <r.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition">{r.title}</h3>
            <p className="text-sm text-slate-500">{r.type}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const EssaySamplesView = ({ onBack }: { onBack: () => void }) => {
  const [selectedEssay, setSelectedEssay] = useState<typeof ESSAY_SAMPLES[0] | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedEssay) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await GeminiService.analyzeWritingTechnique(selectedEssay.question, selectedEssay.answer);
      setAnalysis(result);
    } catch (e) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
       <button 
        onClick={onBack} 
        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 font-medium text-sm"
      >
        <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Back to Resources
      </button>

      {!selectedEssay ? (
        <>
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Band 9 Essay Samples</h2>
          <div className="grid gap-6">
            {ESSAY_SAMPLES.map((essay, idx) => (
              <button 
                key={essay.id}
                onClick={() => setSelectedEssay(essay)}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition text-left group"
              >
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Sample {idx + 1}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-blue-700 transition line-clamp-2">
                  {essay.question}
                </h3>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
           {/* Essay Content */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-200">
               <button onClick={() => setSelectedEssay(null)} className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center">
                 <ArrowRight className="w-3 h-3 rotate-180 mr-1" /> Back to List
               </button>
               <h3 className="font-bold text-slate-800 text-lg">{selectedEssay.question}</h3>
             </div>
             <div className="p-8 overflow-y-auto bg-white flex-grow">
               <div className="prose prose-slate max-w-none font-serif text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">
                 {selectedEssay.answer}
               </div>
             </div>
           </div>

           {/* Analysis Panel */}
           <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 flex flex-col h-full overflow-hidden text-white">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2">
                 <Lightbulb className="w-5 h-5 text-yellow-400" />
                 Technique Analysis
               </h3>
               {!analysis && !isAnalyzing && (
                 <button 
                   onClick={handleAnalyze}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-blue-500/20"
                 >
                   Analyze with AI
                 </button>
               )}
             </div>
             
             <div className="p-8 overflow-y-auto flex-grow">
                {!analysis ? (
                  isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-70">
                      <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-400" />
                      <p>Analyzing structure, grammar, and vocabulary...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                      <BarChart className="w-12 h-12 mb-4" />
                      <p className="max-w-xs">Click the "Analyze" button to get a deep-dive into why this essay achieved a Band 9 score.</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Structure & Coherence</h4>
                        <p className="text-slate-300 leading-relaxed text-sm">{analysis.structureAnalysis}</p>
                        <p className="text-slate-400 text-sm mt-2 italic">{analysis.coherenceComment}</p>
                     </div>

                     <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Key Vocabulary</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.keyVocabulary.map((v: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm">
                              {v}
                            </span>
                          ))}
                        </div>
                     </div>

                     <div>
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Grammar Highlights</h4>
                        <p className="text-slate-300 leading-relaxed text-sm">{analysis.grammarHighlights}</p>
                     </div>
                  </div>
                )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const VocabularyView = ({ onBack }: { onBack: () => void }) => {
  const [activeList, setActiveList] = useState<string>("List 1");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<any>(null);
  const [isLoadingDef, setIsLoadingDef] = useState(false);

  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setDefinitionData(null);
    setIsLoadingDef(true);
    try {
      const data = await GeminiService.getWordDefinition(word);
      setDefinitionData(data);
    } catch (e) {
      console.error(e);
      setDefinitionData({ definition: "Could not load definition.", usage: "", synonyms: [] });
    } finally {
      setIsLoadingDef(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={onBack} 
        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 font-medium text-sm"
      >
        <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Back to Resources
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* List Selector */}
        <div className="md:w-64 flex-shrink-0">
           <h2 className="font-bold text-xl text-slate-900 mb-4">Word Lists</h2>
           <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
             {Object.keys(WORD_LISTS).map(listName => (
               <button
                 key={listName}
                 onClick={() => setActiveList(listName)}
                 className={`px-4 py-3 rounded-lg text-left font-medium whitespace-nowrap transition ${
                   activeList === listName 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                 }`}
               >
                 {listName}
               </button>
             ))}
           </div>
        </div>

        {/* Word Grid */}
        <div className="flex-grow">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[600px]">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
              <span>{activeList} <span className="text-slate-400 font-normal ml-2">({(WORD_LISTS as any)[activeList].length} words)</span></span>
              <span className="text-xs font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Click a word for meaning</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(WORD_LISTS as any)[activeList].map((word: string) => (
                <button
                  key={word}
                  onClick={() => handleWordClick(word)}
                  className={`p-2 text-sm text-left rounded hover:bg-blue-50 hover:text-blue-700 transition ${
                    selectedWord === word ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-300' : 'text-slate-600'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Definition Modal/Overlay */}
      {selectedWord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-blue-600 p-6 flex justify-between items-start text-white">
                <div>
                   <h2 className="text-3xl font-serif font-bold tracking-tight">{selectedWord}</h2>
                   <p className="opacity-80 text-sm mt-1">Academic Vocabulary</p>
                </div>
                <button onClick={() => setSelectedWord(null)} className="hover:bg-white/20 p-1 rounded-full transition">
                  <X className="w-6 h-6" />
                </button>
             </div>
             
             <div className="p-8 min-h-[200px]">
               {isLoadingDef ? (
                 <div className="flex flex-col items-center justify-center h-40 space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse">Generating definition & examples...</p>
                 </div>
               ) : definitionData ? (
                 <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Definition</h4>
                      <p className="text-slate-800 text-lg leading-relaxed">{definitionData.definition}</p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Academic Usage</h4>
                      <p className="text-slate-800 italic">"{definitionData.usage}"</p>
                    </div>

                    {definitionData.synonyms && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Synonyms</h4>
                        <div className="flex flex-wrap gap-2">
                           {definitionData.synonyms.map((s: string) => (
                             <span key={s} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">{s}</span>
                           ))}
                        </div>
                      </div>
                    )}
                 </div>
               ) : (
                 <p className="text-red-500">Failed to load definition.</p>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SetupView = ({ 
  skill, 
  count, 
  setCount, 
  onBack, 
  onStart 
}: { 
  skill: Skill, 
  count: number, 
  setCount: (n: number) => void, 
  onBack: () => void, 
  onStart: () => void 
}) => (
  <div className="max-w-2xl mx-auto px-4 py-16">
    <button 
      onClick={onBack}
      className="text-slate-500 hover:text-slate-800 mb-6 flex items-center text-sm font-medium"
    >
      <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Back to Dashboard
    </button>
    
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        Configure {skill.charAt(0).toUpperCase() + skill.slice(1)} Test
      </h2>
      
      <div className="mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Simulation Length (Number of Questions/Intensity)
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[15, 25, 30, 50].map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                count === c 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-slate-100 hover:border-blue-200 text-slate-600'
              }`}
            >
              <span className="block text-xl font-bold">{c}</span>
              <span className="text-xs uppercase tracking-wide opacity-75">
                {skill === 'writing' ? 'Minutes (Approx)' : 'Questions'}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Selecting a higher number creates a more realistic full-test simulation. 
          For Writing, this adjusts the suggested time limit.
        </p>
      </div>

      <button 
        onClick={onStart}
        className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2"
      >
        Start Simulation <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// --- Test Interface Components ---

const ReadingListeningInterface = ({ 
  test, 
  userResponses, 
  onAnswer, 
  onSubmit 
}: { 
  test: TestContext, 
  userResponses: UserResponse[], 
  onAnswer: (qid: string, val: string) => void, 
  onSubmit: () => void 
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const isListening = test.skill === 'listening';
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  
  const currentQ = test.questions[currentQIndex];
  const currentResponse = userResponses.find(r => r.questionId === currentQ.id)?.answer || '';

  const playAudio = () => {
    if (!test.introText) return;
    const utterance = new SpeechSynthesisUtterance(test.introText);
    utterance.rate = 0.9; 
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
      {/* Source Material Panel */}
      <div className="bg-slate-50 rounded-xl p-6 overflow-y-auto border border-slate-200 h-full">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 sticky top-0 bg-slate-50 py-2">
          {isListening ? 'Audio Transcript' : 'Passage'}
        </h3>
        
        {isListening && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Audio Track</h4>
              <p className="text-xs text-blue-700">Click play to listen to the passage.</p>
            </div>
            <button 
              onClick={playAudio}
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow-sm"
            >
              <Headphones className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className={`prose prose-slate max-w-none ${isListening && !transcriptVisible ? 'blur-sm select-none' : ''}`}>
          {test.introText?.split('\n').map((para, i) => (
            <p key={i} className="mb-4 text-slate-700 leading-relaxed">{para}</p>
          ))}
        </div>

        {isListening && (
          <button 
            onClick={() => setTranscriptVisible(!transcriptVisible)}
            className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            {transcriptVisible ? 'Hide Transcript' : 'Show Transcript (For review)'}
          </button>
        )}
      </div>

      {/* Question Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-500">Question {currentQIndex + 1} of {test.questions.length}</span>
          <div className="flex gap-2">
            <button 
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(i => i - 1)}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button 
               disabled={currentQIndex === test.questions.length - 1}
               onClick={() => setCurrentQIndex(i => i + 1)}
               className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow p-8 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <h3 className="text-xl font-medium text-slate-900 mb-6">
              {currentQ.text}
            </h3>
            
            {currentQ.type === 'multiple-choice' && currentQ.options ? (
              <div className="space-y-3">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onAnswer(currentQ.id, opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      currentResponse === opt 
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea 
                value={currentResponse as string}
                onChange={(e) => onAnswer(currentQ.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-900 placeholder:text-slate-400"
              />
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
           {currentQIndex === test.questions.length - 1 ? (
             <button 
              onClick={onSubmit}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition"
            >
              Submit Test
            </button>
           ) : (
             <button 
              onClick={() => setCurrentQIndex(i => i + 1)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition"
            >
              Next Question
            </button>
           )}
        </div>
      </div>
    </div>
  );
};

const WritingInterface = ({ 
  test, 
  userResponses, 
  onAnswer, 
  onSubmit 
}: { 
  test: TestContext, 
  userResponses: UserResponse[], 
  onAnswer: (taskId: number, val: string) => void, 
  onSubmit: () => void 
}) => {
  // Derive local state from props to prevent loss on re-render, or just use props directly
  const getResponse = (idx: number) => {
    const r = userResponses.find(res => res.taskId === idx);
    return r ? (r.answer as string) : '';
  };

  return (
    <div className="max-w-4xl mx-auto h-full overflow-y-auto pb-12">
      {test.tasks?.map((task, idx) => (
        <div key={idx} className="mb-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100 px-2 py-1 rounded">Task {idx + 1}</span>
            <h3 className="mt-3 text-lg font-bold text-slate-800">{task.title}</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{task.prompt}</p>
            {task.minWords && <p className="mt-2 text-xs text-slate-400 font-medium">Minimum words: {task.minWords}</p>}
          </div>
          <div className="p-6">
             <textarea 
                value={getResponse(idx)}
                onChange={(e) => onAnswer(idx, e.target.value)}
                placeholder="Start writing your response..."
                className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-serif text-lg leading-relaxed text-slate-900 placeholder:text-slate-400"
              />
              <div className="mt-2 text-right text-xs text-slate-400">
                Word Count: {getResponse(idx).split(/\s+/).filter(w => w.length > 0).length}
              </div>
          </div>
        </div>
      ))}
      <button 
        onClick={onSubmit}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition"
      >
        Submit Writing Test
      </button>
    </div>
  );
};

const SpeakingInterface = ({ 
  test, 
  userResponses, 
  onAnswer, 
  onSubmit 
}: { 
  test: TestContext, 
  userResponses: UserResponse[], 
  onAnswer: (partId: number, val: string) => void, 
  onSubmit: () => void 
}) => {
  const [currentPart, setCurrentPart] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
       recognitionRef.current = new SpeechRecognition();
       recognitionRef.current.continuous = true;
       recognitionRef.current.interimResults = true;
       
       recognitionRef.current.onresult = (event: any) => {
         let final = '';
         for (let i = event.resultIndex; i < event.results.length; ++i) {
           if (event.results[i].isFinal) {
             final += event.results[i][0].transcript;
           }
         }
         if (final) {
           setTranscript(prev => prev + " " + final);
         }
       };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      onAnswer(currentPart, transcript);
    } else {
      setTranscript(""); 
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const parts = test.parts || [];
  const isLast = currentPart === parts.length - 1;

  return (
    <div className="max-w-2xl mx-auto pt-12">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
        <div className="bg-amber-500 p-6 text-white">
          <h2 className="text-xl font-bold">Speaking Test: Part {currentPart + 1}</h2>
          <p className="opacity-90">{parts[currentPart]?.title}</p>
        </div>
        
        <div className="p-8">
          <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Examiner asks:</h3>
            <ul className="space-y-4">
              {parts[currentPart]?.questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-slate-800 text-lg">
                  <span className="text-amber-500 font-bold">•</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center gap-6">
             {isRecording ? (
               <div className="relative">
                 <span className="absolute -inset-4 bg-red-100 rounded-full animate-ping"></span>
                 <button 
                  onClick={toggleRecording}
                  className="relative w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition shadow-lg"
                 >
                   <div className="w-8 h-8 bg-white rounded-sm" />
                 </button>
               </div>
             ) : (
               <button 
                onClick={toggleRecording}
                className="w-20 h-20 bg-slate-900 hover:bg-slate-800 rounded-full flex items-center justify-center text-white transition shadow-lg"
               >
                 <Mic className="w-8 h-8" />
               </button>
             )}
             <p className="text-sm font-medium text-slate-500">
               {isRecording ? "Listening... (Speak clearly)" : "Tap to Start Answering"}
             </p>
             
             {isRecording && (
               <div className="w-full mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 italic border border-slate-100 min-h-[60px]">
                 {transcript || "..."}
               </div>
             )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between">
           <button 
             disabled={currentPart === 0 || isRecording}
             onClick={() => setCurrentPart(p => p - 1)}
             className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
           >
             Previous
           </button>
           
           {isLast ? (
             <button 
              disabled={isRecording} 
              onClick={onSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md transition disabled:opacity-50"
             >
               Finish Test
             </button>
           ) : (
              <button 
               disabled={isRecording} 
               onClick={() => setCurrentPart(p => p + 1)}
               className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition disabled:opacity-50"
              >
                Next Part
              </button>
           )}
        </div>
      </div>
    </div>
  );
};

const TestView = ({ 
  test, 
  userResponses, 
  onAnswerQ,
  onAnswerTask,
  onAnswerPart,
  onSubmit 
}: { 
  test: TestContext, 
  userResponses: UserResponse[],
  onAnswerQ: (id: string, val: string) => void,
  onAnswerTask: (id: number, val: string) => void,
  onAnswerPart: (id: number, val: string) => void,
  onSubmit: () => void 
}) => {
  return (
    <div className="min-h-screen bg-slate-100/50 pb-12">
      <div className="max-w-6xl mx-auto px-4 py-6">
         {test.skill === 'writing' && 
           <WritingInterface 
             test={test} 
             userResponses={userResponses} 
             onAnswer={onAnswerTask} 
             onSubmit={onSubmit} 
           />
         }
         {test.skill === 'speaking' && 
           <SpeakingInterface 
             test={test} 
             userResponses={userResponses} 
             onAnswer={onAnswerPart} 
             onSubmit={onSubmit} 
           />
         }
         {(test.skill === 'reading' || test.skill === 'listening') && 
           <ReadingListeningInterface 
             test={test} 
             userResponses={userResponses} 
             onAnswer={onAnswerQ} 
             onSubmit={onSubmit} 
           />
         }
      </div>
    </div>
  );
};

const ResultsView = ({ result, onRestart }: { result: TestResult, onRestart: () => void }) => {
  const { overallBand, criteria, generalFeedback, improvementPlan, skill } = result;
  
  const scoreColor = overallBand >= 7.5 ? 'text-emerald-600' : overallBand >= 6.0 ? 'text-blue-600' : 'text-amber-500';
  const chartHeight = (score: number) => `${(score / 9) * 100}%`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center md:w-1/3 w-full">
          <h2 className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-4">Overall Band Score</h2>
          <div className={`text-8xl font-black ${scoreColor} mb-2 tracking-tighter`}>{overallBand}</div>
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
             {skill.toUpperCase()}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex-1">
           <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
             <BarChart className="w-5 h-5 text-blue-600" /> Examiner's Summary
           </h3>
           <p className="text-slate-600 leading-relaxed">{generalFeedback}</p>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-6">Detailed Criteria Breakdown</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {criteria.map((c, idx) => (
           <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-end mb-4 h-32 relative bg-slate-50 rounded-lg p-2">
                 <div 
                    className="w-full bg-blue-500/20 rounded-b-md absolute bottom-0 left-0" 
                    style={{ height: chartHeight(c.score) }}
                 />
                  <div 
                    className="w-full bg-blue-600 rounded-t-md relative z-10 transition-all duration-1000 ease-out" 
                    style={{ height: chartHeight(c.score) }}
                 ></div>
                 <span className="absolute top-2 right-2 font-bold text-2xl text-slate-800">{c.score}</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2 min-h-[40px]">{c.name}</h4>
              <p className="text-sm text-slate-600 mb-4 h-24 overflow-y-auto">{c.feedback}</p>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-xs font-bold text-amber-700 mb-1">Improvement Tip:</p>
                <p className="text-xs text-amber-900/80">{c.improvement}</p>
              </div>
           </div>
        ))}
      </div>

      <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" /> Action Plan
        </h3>
        <div className="space-y-6">
          {improvementPlan.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                {i + 1}
              </div>
              <p className="text-slate-300 leading-relaxed pt-1">{step}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <button 
           onClick={onRestart}
           className="px-8 py-3 bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 font-bold rounded-xl transition flex items-center gap-2 mx-auto"
        >
          <RefreshCcw className="w-4 h-4" /> Start New Simulation
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'home',
    selectedSkill: null,
    questionCount: 15,
    currentTest: null,
    userResponses: [],
    result: null,
    isLoading: false,
    loadingMessage: ''
  });

  const startTest = async () => {
    if (!state.selectedSkill) return;
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      loadingMessage: `Generating ${state.selectedSkill.charAt(0).toUpperCase() + state.selectedSkill.slice(1)} Test...` 
    }));

    try {
      const test = await GeminiService.generateTest(state.selectedSkill, state.questionCount);
      setState(prev => ({
        ...prev,
        view: 'test',
        currentTest: test,
        isLoading: false,
        userResponses: [] 
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      alert(`Failed to generate test. Please check API key or network.\n\nDetails: ${msg}`);
      console.error(e);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const submitTest = async () => {
    if (!state.currentTest || !state.selectedSkill) return;

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      loadingMessage: 'Analyzing Performance & Estimating Band Score...' 
    }));

    try {
      const result = await GeminiService.evaluateTest(
        state.selectedSkill, 
        state.currentTest, 
        state.userResponses
      );
      setState(prev => ({
        ...prev,
        view: 'results',
        result: result,
        isLoading: false
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      alert(`Evaluation failed.\n\nDetails: ${msg}`);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Response handlers
  const handleQAnswer = (id: string, val: string) => {
    setState(prev => {
      const existing = prev.userResponses.filter(r => r.questionId !== id);
      return { ...prev, userResponses: [...existing, { questionId: id, answer: val }] };
    });
  };

  const handleTaskAnswer = (id: number, val: string) => {
    setState(prev => {
      const existing = prev.userResponses.filter(r => r.taskId !== id);
      return { ...prev, userResponses: [...existing, { taskId: id, answer: val }] };
    });
  };

  const handlePartAnswer = (id: number, val: string) => {
     setState(prev => ({
         ...prev,
         userResponses: [...prev.userResponses, { partId: id, answer: val }]
      }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        currentView={state.view} 
        onNavigate={(view) => setState(prev => ({ ...prev, view, selectedSkill: null, currentTest: null, result: null }))}
      />
      
      {state.isLoading && <LoadingScreen message={state.loadingMessage} />}
      
      <main>
        {state.view === 'home' && (
          <HomeView 
            onSelect={(s) => setState(prev => ({ ...prev, view: 'setup', selectedSkill: s }))} 
          />
        )}
        
        {state.view === 'history' && (
          <HistoryView onBack={() => setState(prev => ({ ...prev, view: 'home' }))} />
        )}

        {state.view === 'resources' && (
          <ResourcesView 
            onOpenVocabulary={() => setState(prev => ({ ...prev, view: 'vocabulary' }))} 
            onOpenEssays={() => setState(prev => ({ ...prev, view: 'essaySamples' }))}
          />
        )}

        {state.view === 'vocabulary' && (
          <VocabularyView onBack={() => setState(prev => ({ ...prev, view: 'resources' }))} />
        )}

        {state.view === 'essaySamples' && (
          <EssaySamplesView onBack={() => setState(prev => ({ ...prev, view: 'resources' }))} />
        )}

        {state.view === 'setup' && state.selectedSkill && (
          <SetupView 
            skill={state.selectedSkill}
            count={state.questionCount}
            setCount={(n) => setState(prev => ({ ...prev, questionCount: n }))}
            onBack={() => setState(prev => ({ ...prev, view: 'home', selectedSkill: null }))}
            onStart={startTest}
          />
        )}

        {state.view === 'test' && state.currentTest && (
          <TestView 
            test={state.currentTest}
            userResponses={state.userResponses}
            onAnswerQ={handleQAnswer}
            onAnswerTask={handleTaskAnswer}
            onAnswerPart={handlePartAnswer}
            onSubmit={submitTest}
          />
        )}

        {state.view === 'results' && state.result && (
          <ResultsView 
            result={state.result} 
            onRestart={() => setState(prev => ({ ...prev, view: 'home', result: null, currentTest: null, userResponses: [] }))}
          />
        )}
      </main>
    </div>
  );
}