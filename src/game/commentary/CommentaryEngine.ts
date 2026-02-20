export type KeeperPersonality = 'ANTICIPATOR' | 'COMMANDER' | 'SAFE_HANDS' | 'SHOWMAN';

export type CommentaryLanguage =
    | 'en'
    | 'es'
    | 'pt'
    | 'fr'
    | 'de'
    | 'it'
    | 'ar'
    | 'hi'
    | 'ja'
    | 'zh';

export type CommentaryIntensity = 'CALM' | 'BALANCED' | 'ENERGETIC';

export type CommentaryFrequency = 'KEY' | 'ALL';

export type MatchEventKind = 'KEEPER_DECISION' | 'GOAL' | 'SHOT_MISS';

export type KeeperDecisionDetail =
    | 'ANTICIPATED_CORRECT'
    | 'ANTICIPATED_WRONG'
    | 'POSITIONAL_SAVE'
    | 'SECURE_SAVE'
    | 'SHOWMAN_HOT'
    | 'SHOWMAN_ERROR';

export interface MatchEventToken {
    id: string;
    kind: MatchEventKind;
    minute: number;
    pressure: number;
    importance: number;
    team: 'HOME' | 'AWAY';
    keeperPersonality?: KeeperPersonality;
    keeperDecisionDetail?: KeeperDecisionDetail;
    shotDifficulty?: number;
    isPenalty?: boolean;
}

export interface CommentarySettingsInput {
    enabled: boolean;
    language: CommentaryLanguage;
    intensity: CommentaryIntensity;
    frequency: CommentaryFrequency;
    explainBigMoments: boolean;
    derby: boolean;
}

type Listener = (event: MatchEventToken) => void;

const listeners: Listener[] = [];
type CommentaryImpactListener = (event: MatchEventToken, weight: number) => void;
const commentaryImpactListeners: CommentaryImpactListener[] = [];

export const subscribeToMatchEvents = (listener: Listener) => {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    };
};

export const subscribeToCommentaryImpact = (listener: CommentaryImpactListener) => {
    commentaryImpactListeners.push(listener);
    return () => {
        const index = commentaryImpactListeners.indexOf(listener);
        if (index >= 0) {
            commentaryImpactListeners.splice(index, 1);
        }
    };
};

export const emitMatchEvent = (event: MatchEventToken) => {
    for (const listener of listeners) {
        listener(event);
    }
};

type LineKey =
    | 'keeper_anticipator_correct'
    | 'keeper_anticipator_wrong'
    | 'keeper_commander_claim'
    | 'keeper_safehands_secure'
    | 'keeper_showman_hot'
    | 'keeper_showman_error'
    | 'goal_high_pressure'
    | 'goal_standard'
    | 'shot_miss_big';

type Tone = 'CALM' | 'ENERGETIC';

type PackEntry = {
    key: LineKey;
    tone: Tone;
    text: string;
};

type LanguagePack = PackEntry[];

const enPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'He read it early and got there in time.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'He guessed early there, and this time it paid off!' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'He moved early and left the door open.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'He tried to read it, and the striker fooled him completely.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'He steps out and takes control of his box.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'He comes out and takes charge, no hesitation at all.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'Not spectacular, but incredibly secure goalkeeping.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'Safe hands again, everything under control.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'He is growing into this game with every save.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'He is flying today, absolutely unbeatable.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'He has lost a bit of composure after that mistake.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'He has lost his composure after that error.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'Under real pressure, that finish is outstanding.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'Massive goal in a huge moment of the match.' },
    { key: 'goal_standard', tone: 'CALM', text: 'Simple finish, but the movement was excellent.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'Clinical from close range, the crowd explodes.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'That was a big chance and he knows it.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'He has to score there, that is a huge chance wasted.' }
];

const esPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'Leyó la jugada y llegó a tiempo.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'Adivinó antes del disparo y esta vez le salió bien.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'Se movió demasiado pronto y dejó el hueco.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'Intentó leerlo y el delantero lo engañó por completo.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'Sale y manda en su área.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'Sale con todo y se adueña del área.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'Nada espectacular, pero muy seguro.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'Otra vez seguro, sin rebote y sin dudas.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'Cada parada le da más confianza.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'Hoy está enorme, parece imbatible.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'Después del error se le nota nervioso.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'Perdió la calma tras ese fallo.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'Gran definición en un momento de mucha presión.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'Golazo en un momento gigante del partido.' },
    { key: 'goal_standard', tone: 'CALM', text: 'Definición sencilla pero bien ejecutada.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'Definición clínica, el estadio se viene abajo.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'Era una ocasión enorme y lo sabe.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'Tenía que marcar ahí, ocasión clarísima desperdiciada.' }
];

const ptPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'Leu a jogada e chegou a tempo.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'Arriscou o canto antes e desta vez deu certo.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'Saiu antes da hora e deixou espaço.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'Tentou adivinhar e o atacante enganou completamente.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'Sai e manda na pequena área.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'Sai com autoridade e toma conta da área.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'Nada espetacular, mas muito seguro.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'Mãos seguras de novo, sem rebote.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'Cada defesa aumenta a confiança dele.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'Hoje está iluminado, praticamente imbatível.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'Depois do erro parece inseguro.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'Perdeu a cabeça depois daquela falha.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'Grande finalização em momento de pressão.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'Golaço num momento gigante do jogo.' },
    { key: 'goal_standard', tone: 'CALM', text: 'Finalização simples, mas eficaz.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'Frieza total na cara do gol.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'Era uma chance enorme e ele sabe disso.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'Tinha de fazer, grande chance desperdiçada.' }
];

const frPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'Il a lu la frappe et intervient à temps.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'Il anticipe très tôt et cette fois, ça lui réussit.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'Il se décale trop tôt et laisse l’espace.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'Il a voulu lire le tir et l’attaquant l’a totalement trompé.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'Il sort et impose sa loi dans la surface.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'Il sort fort et prend totalement le dessus dans sa surface.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'Rien de spectaculaire, mais très sûr.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'Encore une prise de balle sûre, sans risque.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'Chaque arrêt le met encore plus en confiance.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'Il est en feu aujourd’hui, presque imbattable.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'Depuis son erreur, il paraît moins serein.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'Il a perdu ses moyens après cette énorme faute.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'Superbe finition dans un moment de grande pression.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'But immense dans un moment clé du match.' },
    { key: 'goal_standard', tone: 'CALM', text: 'Finition simple mais parfaitement maîtrisée.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'Froid devant le but, la tribune explose.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'C’était une énorme occasion et il le sait.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'Il devait marquer là, occasion monumentale gâchée.' }
];

const dePack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'Er liest den Schuss und ist rechtzeitig da.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'Er spekuliert früh und diesmal liegt er goldrichtig.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'Er bewegt sich zu früh und öffnet die Ecke.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'Er wollte lesen und der Stürmer hat ihn komplett ausgeguckt.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'Er kommt heraus und dominiert seinen Strafraum.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'Er kommt raus und übernimmt sofort das Kommando.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'Nicht spektakulär, aber äußerst sicher.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'Wieder sichere Hände, keine Gefahr im Nachfassen.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'Mit jeder Parade wächst sein Selbstvertrauen.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'Heute ist er kaum zu überwinden, überragende Form.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'Nach dem Patzer wirkt er verunsichert.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'Nach diesem Fehler hat er komplett den Faden verloren.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'Starker Abschluss in einer extremen Drucksituation.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'Riesentor in einem ganz wichtigen Moment.' },
    { key: 'goal_standard', tone: 'CALM', text: 'Einfacher, aber sauberer Abschluss.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'Eiskalt vor dem Tor, das Stadion bebt.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'Das war eine große Chance und das weiß er.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'Die muss er machen, riesige Möglichkeit vergeben.' }
];

const itPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'Legge il tiro e ci arriva in tempo.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'Ha indovinato prima del tiro e stavolta ci prende.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'Si muove troppo presto e lascia il varco.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'Ha provato ad anticipare e l’attaccante lo ha ingannato.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'Esce e comanda nell’area piccola.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'Esce con decisione e si prende tutta l’area.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'Nulla di spettacolare, ma tanta sicurezza.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'Ancora una presa sicura, nessun rischio.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'Ogni parata lo rende più sicuro.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'Oggi vola, sembra imbattibile.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'Dopo l’errore sembra meno lucido.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'Dopo quella papera ha perso completamente la testa.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'Grande conclusione in un momento pesante.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'Gol enorme in un momento chiave della partita.' },
    { key: 'goal_standard', tone: 'CALM', text: 'Conclusione semplice ma precisa.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'Freddo davanti al portiere, esplode lo stadio.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'Era una chance enorme e lui lo sa.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'Lì deve segnare, occasione gigantesca sprecata.' }
];

const arPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'قرأ التسديدة ووصل في الوقت المناسب.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'خمن الزاوية مبكرًا وهذه المرة كان ناجحًا.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'تحرك مبكرًا وترك المساحة مفتوحة.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'حاول أن يقرأ التسديدة والمهاجم خدعه تمامًا.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'يخرج ويفرض سيطرته داخل المنطقة.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'يخرج بقوة ويتحكم تمامًا في منطقة الجزاء.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'ليست تصديًا استثنائيًا، لكنها آمنة جدًا.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'يد آمنة مرة أخرى، بلا ارتداد ولا مخاطرة.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'كل تصدي يمنحه ثقة أكبر.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'اليوم في قمة مستواه، يكاد يكون منيعًا.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'بعد الخطأ يبدو أقل هدوءًا.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'بعد هذا الخطأ فقد أعصابه تمامًا.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'إنهاء رائع في لحظة ضغط كبيرة.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'هدف ضخم في لحظة حاسمة من المباراة.' },
    { key: 'goal_standard', tone: 'CALM', text: 'تسديدة بسيطة لكنها متقنة.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'إنهاء ببرودة أعصاب، والجماهير تنفجر فرحًا.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'كانت فرصة كبيرة وهو يعلم ذلك.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'كان يجب أن يسجل هناك، فرصة هائلة ضاعت.' }
];

const hiPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'उसने शॉट पढ़ा और समय पर पहुंच गया.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: 'उसने पहले ही दिशा भांप ली और इस बार बिल्कुल सही गया.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: 'वह जल्दी हिला और कोना खोल दिया.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: 'उसने पढ़ने की कोशिश की और स्ट्राइकर ने पूरी तरह बेवकूफ बना दिया.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: 'वह निकलता है और अपने बॉक्स पर कंट्रोल लेता है.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: 'वह आगे आता है और पूरे पेनल्टी बॉक्स का मालिक बन जाता है.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: 'ज्यादा ड्रामा नहीं, लेकिन बहुत भरोसेमंद.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'फिर से सुरक्षित कैच, बिना किसी खतरे के.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'हर बचाव के साथ उसका आत्मविश्वास बढ़ रहा है.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: 'आज वह आग पर है, लगभग अजेय.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'गलती के बाद वह थोड़ा घबराया हुआ लग रहा है.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'उस गलती के बाद उसका कॉन्फिडेंस टूट गया है.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: 'दबाव के पल में यह फिनिश शानदार है.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: 'मैच के बड़े पल में बड़ा गोल.' },
    { key: 'goal_standard', tone: 'CALM', text: 'सीधा-साधा लेकिन बेहतरीन फिनिश.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: 'शानदार फिनिश, स्टेडियम उबल रहा है.' },
    { key: 'shot_miss_big', tone: 'CALM', text: 'यह बहुत बड़ा मौका था और वह जानता है.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'उसे यहां गोल करना ही था, बहुत बड़ा मौका चला गया.' }
];

const jaPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: 'シュートを読んで、しっかり間に合いました.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: '早めに動きましたが、今回はその判断が当たりました.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: '少し早く動きすぎてコースを空けてしまいました.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: '読みに行きましたが、ストライカーに完全に逆を取られました.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: '前に出てエリアを支配しています.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: '迷いなく飛び出して、自分のエリアを完全に掌握しました.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: '派手さはありませんが、とても安定しています.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: 'またもや確実なキャッチ、危なげがありません.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: 'セーブを重ねるごとに自信が増しています.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: '今日はノリに乗っています、ほとんど止められない存在です.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: 'あのミスのあと、少し不安定に見えます.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: 'あのエラーで完全にリズムを崩してしまいました.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: '大きなプレッシャーの中で見事なフィニッシュです.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: '試合を動かす大きな場面でのビッグゴールです.' },
    { key: 'goal_standard', tone: 'CALM', text: 'シンプルですが、非常に正確なシュートでした.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: '冷静なフィニッシュでスタジアムが沸きます.' },
    { key: 'shot_miss_big', tone: 'CALM', text: '大きなチャンスでしたが、決め切れませんでした.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: 'あれは決めなければいけません、大チャンスを逃しました.' }
];

const zhPack: LanguagePack = [
    { key: 'keeper_anticipator_correct', tone: 'CALM', text: '他提前读懂了这脚射门并及时到位.' },
    { key: 'keeper_anticipator_correct', tone: 'ENERGETIC', text: '他提前判断了方向，这一次判断完全正确.' },
    { key: 'keeper_anticipator_wrong', tone: 'CALM', text: '他动得太早，把角度留了出来.' },
    { key: 'keeper_anticipator_wrong', tone: 'ENERGETIC', text: '他想提前预判，但前锋把他完全晃倒.' },
    { key: 'keeper_commander_claim', tone: 'CALM', text: '他主动出击，掌控了禁区.' },
    { key: 'keeper_commander_claim', tone: 'ENERGETIC', text: '果断出击，整个禁区都在他的掌控之下.' },
    { key: 'keeper_safehands_secure', tone: 'CALM', text: '不夸张，却非常稳健.' },
    { key: 'keeper_safehands_secure', tone: 'ENERGETIC', text: '再次稳稳地抱住皮球，没有任何二次机会.' },
    { key: 'keeper_showman_hot', tone: 'CALM', text: '每一次扑救都在提升他的信心.' },
    { key: 'keeper_showman_hot', tone: 'ENERGETIC', text: '今天状态火热，简直难以攻破.' },
    { key: 'keeper_showman_error', tone: 'CALM', text: '那次失误之后，他看起来有些不稳.' },
    { key: 'keeper_showman_error', tone: 'ENERGETIC', text: '那次失误之后，他的状态明显下滑.' },
    { key: 'goal_high_pressure', tone: 'CALM', text: '在巨大压力下完成了一脚精彩的射门.' },
    { key: 'goal_high_pressure', tone: 'ENERGETIC', text: '关键时刻打进关键一球.' },
    { key: 'goal_standard', tone: 'CALM', text: '简单但高效的射门.' },
    { key: 'goal_standard', tone: 'ENERGETIC', text: '冷静推射，整座球场瞬间沸腾.' },
    { key: 'shot_miss_big', tone: 'CALM', text: '这是一个绝佳机会，他自己也很清楚.' },
    { key: 'shot_miss_big', tone: 'ENERGETIC', text: '这么好的机会没把握住，实在可惜.' }
];

const packs: Record<CommentaryLanguage, LanguagePack> = {
    en: enPack,
    es: esPack,
    pt: ptPack,
    fr: frPack,
    de: dePack,
    it: itPack,
    ar: arPack,
    hi: hiPack,
    ja: jaPack,
    zh: zhPack
};

const neutralFallback: Record<CommentaryLanguage, string> = {
    en: 'What a moment in this match.',
    es: 'Momento importante en este partido.',
    pt: 'Momento importante na partida.',
    fr: 'Moment important dans ce match.',
    de: 'Ein wichtiger Moment in diesem Spiel.',
    it: 'Momento importante nella partita.',
    ar: 'لحظة مهمة في هذه المباراة.',
    hi: 'मैच का यह एक बड़ा पल है.',
    ja: '試合の中で大きな場面です.',
    zh: '这是一场比赛中的关键时刻.'
};

const pickLineKeyForEvent = (event: MatchEventToken): LineKey | null => {
    if (event.kind === 'KEEPER_DECISION' && event.keeperPersonality && event.keeperDecisionDetail) {
        if (event.keeperPersonality === 'ANTICIPATOR') {
            if (event.keeperDecisionDetail === 'ANTICIPATED_CORRECT') {
                return 'keeper_anticipator_correct';
            }
            if (event.keeperDecisionDetail === 'ANTICIPATED_WRONG') {
                return 'keeper_anticipator_wrong';
            }
        }
        if (event.keeperPersonality === 'COMMANDER') {
            return 'keeper_commander_claim';
        }
        if (event.keeperPersonality === 'SAFE_HANDS') {
            return 'keeper_safehands_secure';
        }
        if (event.keeperPersonality === 'SHOWMAN') {
            if (event.keeperDecisionDetail === 'SHOWMAN_ERROR') {
                return 'keeper_showman_error';
            }
            return 'keeper_showman_hot';
        }
    }
    if (event.kind === 'GOAL') {
        if (event.importance >= 0.7 || event.minute >= 80 || (event.shotDifficulty || 0) > 0.4) {
            return 'goal_high_pressure';
        }
        return 'goal_standard';
    }
    if (event.kind === 'SHOT_MISS') {
        if ((event.shotDifficulty || 0) > 0.35 || event.importance > 0.6) {
            return 'shot_miss_big';
        }
    }
    return null;
};

const pickTone = (intensity: CommentaryIntensity): Tone => {
    if (intensity === 'CALM') {
        return 'CALM';
    }
    if (intensity === 'ENERGETIC') {
        return 'ENERGETIC';
    }
    return Math.random() < 0.5 ? 'CALM' : 'ENERGETIC';
};

export const selectCommentaryLine = (
    event: MatchEventToken,
    settings: CommentarySettingsInput
): string | null => {
    if (!settings.enabled) {
        return null;
    }
    const importance = event.importance || 0;
    if (settings.frequency === 'KEY') {
        const cutoff = settings.derby ? 0.5 : 0.6;
        if (importance < cutoff) {
            return null;
        }
    }
    let effectiveEvent = event;
    if (settings.derby) {
        const boostedImportance = Math.min(1, importance + 0.1);
        const boostedMinute = event.minute >= 45 ? event.minute + 5 : event.minute;
        effectiveEvent = {
            ...event,
            importance: boostedImportance,
            minute: boostedMinute
        };
    }
    const key = pickLineKeyForEvent(effectiveEvent);
    if (!key) {
        return null;
    }
    const pack = packs[settings.language] || packs.en;
    const tone = pickTone(settings.intensity);
    const candidates = pack.filter((entry) => entry.key === key && entry.tone === tone);
    const list = candidates.length > 0 ? candidates : pack.filter((entry) => entry.key === key);
    if (!list.length) {
        return neutralFallback[settings.language] || neutralFallback.en;
    }
    const chosen = list[Math.floor(Math.random() * list.length)];
    let impactWeight = 0;
    if (effectiveEvent.kind === 'GOAL') {
        impactWeight = 0.18 + (effectiveEvent.importance || 0) * 0.25 + (effectiveEvent.shotDifficulty || 0) * 0.15;
    } else if (effectiveEvent.kind === 'KEEPER_DECISION') {
        impactWeight = 0.08 + (effectiveEvent.importance || 0) * 0.18;
        if (event.isPenalty) {
            impactWeight += 0.12;
        }
    } else if (effectiveEvent.kind === 'SHOT_MISS') {
        impactWeight = 0.04 + (effectiveEvent.shotDifficulty || 0) * 0.2 + (effectiveEvent.importance || 0) * 0.12;
    }
    if (settings.derby) {
        impactWeight *= 1.15;
    }
    if (settings.explainBigMoments && (effectiveEvent.kind === 'GOAL' || effectiveEvent.kind === 'KEEPER_DECISION')) {
        impactWeight *= 1.35;
    }
    impactWeight = Math.max(0, Math.min(0.5, impactWeight));
    if (impactWeight > 0.01) {
        const base = 0.7;
        const bias =
            settings.intensity === 'ENERGETIC' ? 0.4 : settings.intensity === 'CALM' ? 0 : 0.2;
        const scaled = impactWeight * (base + bias);
        for (const listener of commentaryImpactListeners) {
            listener(event, Math.max(0.01, Math.min(0.5, scaled)));
        }
    }
    if (!settings.explainBigMoments) {
        return chosen.text;
    }
    if (effectiveEvent.kind === 'KEEPER_DECISION' && effectiveEvent.keeperPersonality) {
        if (effectiveEvent.isPenalty) {
            if (
                effectiveEvent.keeperDecisionDetail === 'SECURE_SAVE' ||
                effectiveEvent.keeperDecisionDetail === 'POSITIONAL_SAVE' ||
                effectiveEvent.keeperDecisionDetail === 'SHOWMAN_HOT'
            ) {
                return chosen.text + ' From the spot, that save is massive for his team.';
            }
            if (
                effectiveEvent.keeperDecisionDetail === 'ANTICIPATED_WRONG' ||
                effectiveEvent.keeperDecisionDetail === 'SHOWMAN_ERROR'
            ) {
                return chosen.text + ' From the spot, he guessed wrong and paid for it.';
            }
        }
        if (effectiveEvent.keeperPersonality === 'ANTICIPATOR' && effectiveEvent.keeperDecisionDetail === 'ANTICIPATED_WRONG') {
            return chosen.text + ' He moved before the shot and paid the price.';
        }
        if (effectiveEvent.keeperPersonality === 'SAFE_HANDS') {
            return chosen.text + ' He chose the safe option and killed the rebound.';
        }
        if (effectiveEvent.keeperPersonality === 'SHOWMAN') {
            if (effectiveEvent.keeperDecisionDetail === 'SHOWMAN_ERROR') {
                return chosen.text + ' The moment got too big and the decision was wrong.';
            }
            return chosen.text + ' He is feeding off the energy of that save.';
        }
    }
    if (effectiveEvent.kind === 'GOAL') {
        if ((effectiveEvent.importance || 0) >= 0.7 || effectiveEvent.minute >= 80) {
            return chosen.text + ' It could completely change the momentum of this match.';
        }
        if ((effectiveEvent.shotDifficulty || 0) > 0.4) {
            return chosen.text + ' The angle and pressure made that chance far from easy.';
        }
    }
    if (effectiveEvent.kind === 'SHOT_MISS' && (effectiveEvent.shotDifficulty || 0) > 0.4) {
        return chosen.text + ' It was not a simple finish, but it was still a big opening.';
    }
    return chosen.text;
};
