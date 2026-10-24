/**
 * When ANTHROPIC_API_KEY is absent the product must still work end to end, so this
 * sample reading runs through the same contract as a live one and is labelled "demo"
 * in the interface. It is written in the product's default voice: simple Hinglish for
 * a student, following the same rulebook a live reading uses, with one upay per problem.
 */
import { FEATURES, normalizeReport, type FindingGroup, type Profile, type Report } from '../src/lib/report';
import { luckyFrom, ruleForMount } from './rules';

const feature = (id: string) => FEATURES.find((f) => f.id === id)!;

const finding = (
  id: string,
  confidence: number,
  meaning: string,
  prominence = 0,
): { id: string; group: FindingGroup; label: string; visible: boolean; confidence: number; prominence: number; meaning: string } => ({
  id,
  group: feature(id).group,
  label: feature(id).label,
  visible: true,
  confidence,
  prominence,
  meaning,
});

export function demoReading(profile: Profile): Report {
  const both = profile.handChoice === 'both';
  const venus = ruleForMount('mount_venus')!;

  const raw = {
    persona: {
      title: 'The Curious Creator',
      tagline: 'Ideas ki factory — bas ek ko poora karne ka timer lagao.',
    },
    superpower:
      'Mushkil topic ko aasan bana kar samjhana — lambi head line aur firm Mercury mount isi ka sign hain.',
    study: {
      style:
        'Aap bol kar aur draw kar ke sabse jaldi seekhte ho. Head line Moon ki taraf jaati hai, isliye mind maps, diagrams aur kisi dost ko samjhana aapke liye ratne se kai guna better hai.',
      bestTime: 'Subah jaldi, ya shaam ke 25-minute sprints',
      tips: [
        '25 minute padhai, 5 minute break — phone doosre kamre mein.',
        'Har chapter ke baad ek mind map banao, sirf keywords aur arrows.',
        'Hafte mein ek baar kisi dost ko ek topic padhao — samjha diya to yaad ho gaya.',
      ],
    },
    careers: [
      { title: 'Design / UX', why: 'Apollo aur Moon mount bhare hain — creativity ko kisi ke kaam aane wali shape dena aapko suit karta hai.' },
      { title: 'Teaching / Content creation', why: 'Firm Mercury mount — baat ko simple bana kar samjhana aapki natural strength hai.' },
      { title: 'Psychology / Research', why: 'Lambi head line aur intuition line — logon ko aur ideas ko gehraai se samajhna.' },
      { title: 'Marketing / Strategy', why: 'Air hand aur strong Jupiter — ideas ko logon se jodna aur lead lena.' },
    ],
    handType: 'Air',
    handTypeNote:
      'Aapka palm thoda square hai aur ungliyan lambi — yeh Air hand hai. Iska matlab: sochne-samajhne wala dimaag, ideas aur baaton se logon ko jodne ki kshamta.',
    clarityScore: 78,
    essence: [
      'Curious dimaag, saaf baatein, aur ideas jo kabhi khatam nahi hote.',
      'Dost kam par pakke — aapki loyalty hi aapka style hai.',
      'Ek goal chuno, aur aap use dheere-dheere pakka bana loge.',
    ],
    traits: { creativity: 84, logic: 78, emotion: 66, ambition: 72, intuition: 75, stability: 61 },
    findings: [
      finding(
        'life',
        86,
        'Aapki life line anguthe ke base ke around ek chaudi, na tootne wali curve banati hai. Traditional reading mein chaudi sweep ka matlab hai steady energy — lambe exam season bhi aap jhel lete ho. Yeh line jeene ke tareeke ki baat karti hai, umar ki nahi.',
      ),
      finding(
        'head',
        88,
        'Head line life line se jaldi alag ho jaati hai — aap cheezein khud samajhna pasand karte ho, bheed ki raay se pehle. Line Moon ki taraf lambi jaati hai, isliye imagination aur logic aapke paas saath chalte hain.',
      ),
      finding(
        'heart',
        84,
        'Heart line saaf hai aur Jupiter ki taraf mudti hai, end par chhota fork. Curve ka matlab: dosti mein aap idealist ho. Fork ka matlab: logon ko waise dekhna jaise woh hain, sirf waise nahi jaise aap chahte ho.',
      ),
      finding(
        'fate',
        61,
        'Fate line neeche se shuru hoti hai par palm ke beech ke baad strong hoti hai. Matlab: abhi stream ya career pe confusion normal hai — disha tab pakki hogi jab aap khud try karke chunoge.',
      ),
      finding(
        'sun',
        64,
        'Sun line Apollo tak halki aati hai — talent hai, par aap khud ko spotlight mein nahi laate. Apna kaam dikhana seekho; recognition kaam ke peeche-peeche aati hai.',
      ),
      finding(
        'mercury',
        55,
        'Mercury line chhoti aur saaf hai — baat kar ke soch saaf karne ki aadat. Beech mein halki chain batati hai ki exam se pehle nervous energy zyada hoti hai; us waqt speed kam karna hi upay hai.',
      ),
      finding(
        'marriage',
        58,
        'Chhoti ungli ke neeche do saaf relationship lines hain. Yeh dikhata hai ki aap kam logon se, par gehra judte ho — aapke close friends saalon tak saath rehte hain.',
      ),
      finding(
        'bracelet',
        72,
        'Wrist par ek saaf Manibandh line hai. Iska matlab grounding — fixed routine aapko steady rakhta hai, aur isi se energy bani rehti hai.',
      ),
      finding(
        'intuition',
        63,
        'Moon se Mercury ki taraf halki intuition line hai. Gut feeling aksar sahi hoti hai — MCQ mein pehla answer aksar sahi nikalta hai — par aap use logic se check karte ho. Yahi balance aapki strength hai.',
      ),
      finding(
        'mount_jupiter',
        74,
        'Jupiter index finger ke neeche bhara hua hai — group project mein log naturally aapki taraf dekhte hain. Leadership aapke liye zimmedari lena hai, boss banna nahi.',
        72,
      ),
      finding(
        'mount_saturn',
        52,
        'Saturn flat hai. Iska matlab: routine aapko pinjre jaisa lagta hai, isliye padhai ka time-table banana mushkil hota hai. Yahi aapka level-up area hai.',
        48,
      ),
      finding(
        'mount_apollo',
        62,
        'Apollo thoda bhara hai — art, design, writing jaisi creative cheezein aapko khushi deti hain. Aapki khushi ka raasta kaam ke andar hai, uske baahar nahi.',
        58,
      ),
      finding(
        'mount_mercury',
        66,
        'Mercury firm hai — bol kar soch saaf karna, presentations aur debates mein comfortable. Logon se jaldi judna aapka plus point hai.',
        62,
      ),
      finding(
        'mount_venus',
        79,
        'Venus sabse bhara mount hai — warmth, music aur sundar cheezon se pyaar, aur doston ke liye bada dil. Yeh aapka ruling planet hai: jo kaam dil se pasand ho, usme aap sabse aage jaate ho.',
        76,
      ),
      finding(
        'mount_moon',
        71,
        'Moon chaudi hai — imagination strong hai. Aap pehle picture dekhte ho, phir samjhate ho — isliye diagrams aur stories se padhai jaldi yaad hoti hai.',
        68,
      ),
      finding(
        'mount_mars_upper',
        56,
        'Upper Mars gentle hai — himmat shor mein nahi, patience mein dikhti hai. Tough exam week mein aap shaant reh kar nikal jaate ho.',
        52,
      ),
      finding(
        'mount_mars_lower',
        61,
        'Lower Mars thoda firm hai — jo aapko matter karta hai, uske liye aap bina drama stand lete ho.',
        57,
      ),
      {
        id: 'mark_fork',
        group: 'mark' as const,
        label: 'Head line ke end par fork',
        visible: true,
        confidence: 63,
        prominence: 0,
        meaning:
          'Head line ke end par fork ka matlab: ek dimaag jo do cheezein saath pakad sakta hai — practical aur imaginative. Science + art, ya tech + design jaisa combo aapko suit karta hai.',
      },
    ],
    handDetails: {
      fingers:
        'Lambi aur tapered, ring aur little finger ke beech thoda gap — apne faisle khud lene ki jagah chahiye.',
      thumb:
        'Seedha, firm angutha — mood chala jaaye tab bhi willpower chalti rehti hai.',
      nails:
        'Oval nakhun, halki vertical lines — active mind jo proper rest maangta hai.',
    },
    sections: {
      personality: {
        insights: [
          {
            text: 'Aap class ke woh insaan ho jo confusing cheez ko ek line mein samjha deta hai. Head line aur Jupiter mount saath mil kar natural explainer dikhate hain.',
            confidence: 84,
          },
          {
            text: 'Air hand ka matlab: aap bol kar aur likh kar sochte ho. Chup baith kar sochna aapka strongest mode nahi — discussion mein aapke best ideas aate hain.',
            confidence: 76,
          },
        ],
      },
      studies: {
        insights: [
          {
            text: 'Lambi head line deep understanding deti hai, par flat Saturn ki wajah se lamba time-table toot jaata hai. Chhote sprints aapke liye lambe sessions se better kaam karenge.',
            confidence: 80,
          },
          {
            text: 'Moon mount strong hai — visual memory achhi hai. Notes ko colours, diagrams aur flowcharts mein banao; ratne se zyada yaad rahega.',
            confidence: 72,
          },
        ],
      },
      career: {
        insights: [
          {
            text: 'Fate line beech mein strong hoti hai — career seedhi ladder nahi, ek turning point wala raasta hai. Abhi alag-alag cheezein try karna aapke liye waste nahi, research hai.',
            confidence: 72,
          },
          {
            text: 'Mercury firm aur Apollo moderate — design, teaching, content, psychology ya kuch bhi jo mushkil cheez ko samjhane layak banata hai, is haath ko suit karta hai.',
            confidence: 64,
          },
        ],
      },
      friendships: {
        insights: [
          {
            text: 'Jupiter ki taraf mudti forked heart line loyalty with standards dikhati hai: aap dost kam banate ho, par pakke. Fake vibes aap jaldi pakad lete ho.',
            confidence: 78,
          },
          {
            text: 'Aap doston ki help bahut karte ho par khud help maangne mein jhijhakte ho. Group mein apni baat bhi pehle rakhna seekho — log sunna chahte hain.',
            confidence: 60,
          },
        ],
      },
      wellbeing: {
        insights: [
          {
            text: 'Chaudi life line aur saaf bracelet resilience dikhate hain. Aapka body rhythm pasand karta hai — fixed sleep time, thoda walk, aur khane ka predictable time.',
            confidence: 62,
          },
          {
            text: 'Mercury aur lambi head line aksar un logon ki hoti hai jo dimaag mein rehte hain aur shoulders bhool jaate hain. Padhai ke beech paanch minute stretching ya breathing kaafi hai.',
            confidence: 48,
          },
        ],
      },
    },
    strengths: [
      'Mushkil cheezein aasan bana kar samjhate ho — doston ke liye free tutor.',
      'Loyal dost — log moods nahi, saalon tak aap par bharosa kar sakte hain.',
      'Logic aur creativity dono ek saath chalate ho.',
    ],
    challenges: [
      {
        problem:
          'Procrastination: aap "perfect mood" ka wait karte ho aur padhai tal jaati hai. Flat Saturn mount routine ko boring bana deta hai.',
        solution:
          'Roz ek chhota task dopahar se pehle khatam karo — sirf 25 minute. Same time, same jagah. Saturn ko motivation nahi, structure chahiye.',
      },
      {
        problem:
          'Overthinking: lambi head line har option ko das baar sochti hai, aur decision late ho jaata hai.',
        solution:
          'Is hafte ek chhota decision 2 minute mein lo — kaunsa chapter pehle, kaunsa project. Ek "decision diary" mein likho aur mahine baad padho.',
      },
      {
        problem:
          'Help maangne mein jhijhak: strong Jupiter ki wajah se log aapko self-sufficient samajhte hain, isliye madad apne aap nahi aati.',
        solution:
          'Hafte mein ek baar kisi teacher ya dost se seedha poochho: "Yeh mujhe samajh nahi aaya, help karoge?" Chhota aur clear.',
      },
    ],
    lifePhases: [
      {
        period: 'School years',
        note: 'Fate line shuruaat mein halki: alag-alag subjects aur hobbies try karne ka time. Yahan seekhi skills baad mein bahut kaam aayengi.',
      },
      {
        period: 'College years',
        note: 'Jahan fate line gehri hoti hai, wahan aap apne terms par ek field chunte ho. Pehle saal naya lagega, phir aap usme flow pakad loge.',
      },
      {
        period: 'First job years',
        note: 'Head line ka fork khulta hai: aapki do alag skills milkar ek aisa kaam banati hain jo sirf aap kar sakte ho.',
      },
    ],
    outlook: {
      headline: 'Ek cheez ko poora karne ka saal.',
      points: [
        'Teen naye projects shuru karne se better hai ek poora karke dikhana — portfolio ya competition mein.',
        'Exam season se pehle routine set karo; aapki energy steady hai, endless nahi.',
        'Ek naya skill (design, coding, public speaking) try karo — Mercury aur Apollo isse support karte hain.',
        'Doston ko appreciation abhi bolo, occasion ka wait mat karo.',
      ],
    },
    lucky: luckyFrom(venus),
    remedies: [
      'Roz paanch minute silent breathing, phone kholne se pehle — Air hand breath se settle hota hai.',
      'Ek ghanta roz phone-free padhai — phone doosre kamre mein.',
      'Hafte mein ek baar kisi ki help karo — notes share karo ya kuch samjhao. Venus generosity se balance hota hai.',
    ],
    bothHands: both
      ? {
          inherited:
            'Non-dominant haath par heart line gehri aur fate line halki hai: sabko khush rakhne aur doosron ke hisaab se chalne ki inherited aadat.',
          developed:
            'Dominant haath par fate line strong hai — aap apna raasta khud chunna seekh rahe ho.',
          comparison:
            'Saath padho to kahani yeh hai: doosron ki sun kar chalne wala bachpan, ab apni marzi ke goals mein badal raha hai. Yeh badlav aapki choice hai, majboori nahi.',
        }
      : undefined,
  };

  return normalizeReport(raw, { language: 'hinglish', mode: 'demo', bothHands: both });
}
