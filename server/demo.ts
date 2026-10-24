/**
 * When ANTHROPIC_API_KEY is absent the product must still work end to end, so this
 * sample reading runs through the same contract as a live one and is labelled "demo"
 * in the interface. It is written in the product's default voice: simple Hinglish,
 * following the same rulebook a live reading uses, with one upay per problem.
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
    handType: 'Air',
    handTypeNote:
      'Aapka palm thoda square hai aur ungliyan lambi — yeh Air hand hai. Iska matlab: sochne-samajhne wala dimaag, ideas aur baaton se logon ko jodne ki kshamta.',
    clarityScore: 78,
    essence: [
      'Sochne wala haath: curious, bolne mein saaf, aur door ke ideas ko jodne mein tez.',
      'Pyaar gehra hai, par aap use bharose se dikhate ho — glamour se nahi.',
      'Jab disha apni lagi, aap use dheere-dheere pakka banate ho.',
    ],
    traits: { creativity: 84, logic: 78, emotion: 66, ambition: 72, intuition: 75, stability: 61 },
    findings: [
      finding(
        'life',
        86,
        'Aapki life line anguthe ke base ke around ek chaudi, na tootne wali curve banati hai. Traditional reading mein chaudi sweep ka matlab hai steady energy aur jeene ki achhi bhookh — yeh line jeene ke tareeke ki baat karti hai, umar ki nahi.',
      ),
      finding(
        'head',
        88,
        'Head line life line se jaldi alag ho jaati hai — aap situation khud samajhna pasand karte ho, bheed ki raay se pehle. Line Moon ki taraf lambi jaati hai, isliye imagination aur logic aapke paas saath chalte hain.',
      ),
      finding(
        'heart',
        84,
        'Heart line saaf hai aur Jupiter ki taraf mudti hai, end par chhota fork. Curve ka matlab: pyaar mein aap idealist ho. Fork ka matlab: logon ko waise dekhna jaise woh hain, sirf waise nahi jaise aap chahte ho.',
      ),
      finding(
        'fate',
        61,
        'Fate line neeche se shuru hoti hai par palm ke beech ke baad strong hoti hai, thoda offset ke saath. Yeh un raaston ki line hai jo aapko diye nahi gaye — disha tab asli bani jab aapne khud chuni.',
      ),
      finding(
        'sun',
        64,
        'Sun line Apollo tak halki aati hai — talent dikhta hai, par aap khud ko spotlight mein nahi laate. Iska matlab yeh nahi ki recognition nahi milegi; matlab yeh hai ki kaam pehle, dikhawa baad mein.',
      ),
      finding(
        'mercury',
        55,
        'Mercury line chhoti aur saaf hai — baat kar ke soch saaf karne ki aadat. Beech mein halki chain batati hai ki kabhi-kabhi nervous energy zyada hoti hai; us waqt speed kam karna hi upay hai.',
      ),
      finding(
        'marriage',
        58,
        'Chhoti ungli ke neeche do level relationship lines hain, upar wali geha. Traditional reading mein yeh ek samajhdaar bond dikhati hai jo dheere bana, achanak nahi. Number ki ginti yahan matter nahi karti.',
      ),
      finding(
        'bracelet',
        72,
        'Wrist par ek saaf Manibandh line hai. Iska matlab grounding — fixed routine aapko physically steady rakhta hai, aur isi se energy bani rehti hai.',
      ),
      finding(
        'intuition',
        63,
        'Moon se Mercury ki taraf halki intuition line hai. Gut feeling aksar sahi hoti hai, par aap use saboot se check karte ho — yahi balance is haath ki strength hai.',
      ),
      finding(
        'mount_jupiter',
        74,
        'Jupiter index finger ke neeche bhara hua hai — leadership ka matlab aapke liye zimmedari lena hai, command karna nahi. Log aap par bharosa jaldi karte hain.',
        72,
      ),
      finding(
        'mount_saturn',
        52,
        'Saturn flat hai. Iska matlab: duty ke liye duty se zyada, aapke liye meaning matter karta hai. Isi wajah se structure banane mein thodi mehnat lagti hai — aur wahi aapka kaam karne ka area hai.',
        48,
      ),
      finding(
        'mount_apollo',
        62,
        'Apollo thoda bhara hai — recognition ki zaroorat hai, par woh applause se zyada apne craft se milti hai. Aapki khushi ka raasta kaam ke andar hai, uske baahar nahi.',
        58,
      ),
      finding(
        'mount_mercury',
        66,
        'Mercury firm hai — bol kar soch saaf karna, aur logon se jaldi judna. Chhoti baat mein bhi aapka dimaag fit hota hai.',
        62,
      ),
      finding(
        'mount_venus',
        79,
        'Venus sabse bhara mount hai — warmth, beauty ki bhookh, aur ek body jo music aur touch maangti hai. Yeh aapka ruling planet hai: pyaar aur sukoon aapke bade faisle chalate hain.',
        76,
      ),
      finding(
        'mount_moon',
        71,
        'Moon chaudi hai — imagination, par practical edge ke saath. Aap plan ko pehle picture mein dekhte ho, phir kisi ko samjhate ho; bina picture ke plan adhura lagta hai.',
        68,
      ),
      finding(
        'mount_mars_upper',
        56,
        'Upper Mars gentle hai — himmat confrontation se zyada patience mein dikhti hai. Bhaari waqt mein aap shaant reh kar sahi waqt ka intezaar karte ho.',
        52,
      ),
      finding(
        'mount_mars_lower',
        61,
        'Lower Mars thoda firm hai — jo aapko matter karta hai, use bina shor ke defend karte ho. Isi wajah se log aapko galat nahi samajhte, bas aapki himmat ko shor se nahi jodte.',
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
          'Head line ke end par fork ka matlab: ek dimaag jo do cheezein saath pakad sakta hai — practical aur imaginative. Isi wajah se aap ek saath do fields mein comfortable ho sakte ho.',
      },
    ],
    handDetails: {
      fingers:
        'Lambi aur tapered, ring aur little finger ke beech thoda gap — apne faisle khud lene ki jagah chahiye.',
      thumb:
        'Seedha, firm angutha — willpower mood ke jaane ke baad bhi chalti rehti hai.',
      nails:
        'Oval nakhun, halki vertical lines — active mind jo deliberate rest maangta hai.',
    },
    sections: {
      personality: {
        insights: [
          {
            text: 'Aap woh insaan ho jo baat ko naam deta hai jab baaki log uske around ghoom rahe hote hain. Head line aur Jupiter mount saath mil kar natural editor dikhate hain: aap mess mein structure dekh lete ho, aur beech mein center na hone par andar se thoda impatient hote ho.',
            confidence: 84,
          },
          {
            text: 'Air hand aur jaldi alag hone wali head line ka matlab: aap bol kar aur likh kar sochte ho. Chup baith kar sochna aapka strongest mode nahi — sach aapko bolte hue teen sentence ke baad samajh aata hai.',
            confidence: 76,
          },
        ],
      },
      career: {
        insights: [
          {
            text: 'Fate line beech mein strong hoti hai — career mein ek badi turning point hai, seedhi ladder nahi. Aise roles jahan poora problem aapka ho, uska tukda nahi, wahan aap visitor nahi lagte.',
            confidence: 72,
          },
          {
            text: 'Mercury firm aur Apollo moderate hai — teaching, writing, strategy, design research, ya kuch bhi jo mushkil cheez ko samjhane layak banata hai, is haath ko suit karta hai. Yahan paisa clarity se aata hai, sirf ghanton se nahi.',
            confidence: 64,
          },
        ],
      },
      love: {
        insights: [
          {
            text: 'Jupiter ki taraf mudti forked heart line loyalty with standards dikhati hai: aap rehte ho, par character ke liye. Tenderness ki zaroorat aap kam dikhate ho, phir hairan hote ho jab woh milti nahi.',
            confidence: 78,
          },
          {
            text: 'Do level relationship lines batati hain ki attachment saalon mein gehra hota hai, achanak bhadakta nahi. Is haath ka kaam: affectionate baat zor se kehna, "already pata hai" maan kar chhodna nahi.',
            confidence: 58,
          },
        ],
      },
      family: {
        insights: [
          {
            text: 'Bracelet line aur bhara Venus batate hain ki family life aapko physically steady karti hai — saath khana, rituals, wapas aane ki jagah. Aap support practice se dete ho: theek karke, arrange karke, yaad rakhkar.',
            confidence: 68,
          },
          {
            text: 'Fate line ke shuruaat ke chhote gap ka matlab: ek inherited expectation jise aapne chup chaap chhod diya. Us choice ko naam dena, usse defend karne se zyada family friction kam karta hai.',
            confidence: 55,
          },
        ],
      },
      health: {
        insights: [
          {
            text: 'Chaudi life line aur saaf bracelet traditional reading mein resilience dikhate hain. Ise invitation maano, promise nahi: aapka body rhythm pasand karta hai — fixed sleep, walking, aur khane ke predictable time.',
            confidence: 62,
          },
          {
            text: 'Mercury aur lambi head line aksar un logon ki hoti hai jo dimaag mein rehte hain aur shoulders bhool jaate hain. Lambi concentration ke beech paanch minute stretching ya breathing is pattern ka sabse simple support hai.',
            confidence: 48,
          },
        ],
      },
    },
    strengths: [
      'Mushkil cheezein aasan bana kar samjhate ho, bina unka matlab kam kiye.',
      'Aapka pyaar tikta hai — log moods nahi, saal bhar bharosa kar sakte hain.',
      'Practical aur imaginative kaam ek hi hafte mein saath utha sakte ho.',
    ],
    challenges: [
      {
        problem:
          'Analysis ko action samajh lena: aap ready hone ka wait karte rehte ho aur decision tal jaata hai. Head line ka lamba, thinking wala hissa aapko over-think tak le jaata hai.',
        solution:
          'Is hafte ek chhota, reversible decision bina poori tarah ready hone ke le lo — aaj hi. Roz ek task dopahar se pehle khatam karo; Saturn ko structure chahiye, motivation nahi.',
      },
      {
        problem:
          'Aap help maangte kam ho. Jupiter mount strong hai, isliye log aapko self-sufficient samajhte hain — madad apne aap nahi aati.',
        solution:
          'Hafte mein ek baar specifically kaho: "Yeh mujhe akela nahi karna, tum help karoge?" Chhota aur clear — Jupiter ka upay hai apni zaroorat baatna, sirf knowledge nahi.',
      },
      {
        problem:
          'Rest aapko kamaya hua lagta hai. Venus bhara hai, par aap pleasure ko hamesha baad ke liye rakhte ho, aur thakan ko rest se nahi, zyada kaam se theek karte ho.',
        solution:
          'Roz ek cheez sirf pleasure ke liye karo — das minute music, ped ke neeche baithna, achhi chai. Venus ka classic upay: bina kamaaye achhi cheez lena.',
      },
    ],
    lifePhases: [
      {
        period: 'Teens se mid-20s',
        note: 'Fate line shuruaat mein halki: shapes try karne ka time, ek commit karne ka nahi. Yahan seekhi skills baad mein second practice ban kar wapas aati hain.',
      },
      {
        period: 'Late 20s se late 30s',
        note: 'Jahan fate line gehri hoti hai, haath apne terms par liya gaya decision dikhata hai — aksar city, field ya dono ka change. Pehle saal apprentice jaise lagenge.',
      },
      {
        period: 'Late 30s ke baad',
        note: 'Line settle hoti hai aur head line ka fork khulta hai: aapke do alag experience ek aise kaam mein judte hain jo sirf aap kar sakte ho. Yahan speed se zyada patience kaam karta hai.',
      },
    ],
    outlook: {
      headline: 'Ek cheez theek se chunne ka saal.',
      points: [
        'Agle 12 mahine novelty se zyada depth ko support karte hain: ek project publicly finish karo, teen chup chaap shuru karne se zyada.',
        'Paisa extra ghanton se nahi, negotiation se sudhrega — Mercury mount number saaf maangne ko support karta hai.',
        'Rishton mein directness chahiye: appreciation ab kaho, occasion ka wait mat karo.',
        'Sabse busy mahinon mein neend bachao. Is haath ki energy steady hai, endless nahi.',
      ],
    },
    lucky: luckyFrom(venus),
    remedies: [
      'Roz paanch minute silent breathing, messages kholne se pehle — Air hand breath se settle hota hai, zyada input se nahi.',
      'Ek notebook sirf decisions ke liye: choice, date aur expectation likho. Mahine mein ek baar padho — yeh overthinking ka seedha upay hai.',
      'Hafte mein ek cheez do — time, skill ya paisa. Venus sabse bhara mount hai; generosity use balance karti hai.',
    ],
    bothHands: both
      ? {
          inherited:
            'Non-dominant haath par heart line gehri aur fate line halki hai: sukoon rakhne aur doosron ko disha dene ki inherited aadat.',
          developed:
            'Dominant haath par heart line halki, par fate line strong — aapne pyaar actions mein kehna seekha, aur apna raasta khud chunna.',
          comparison:
            'Saath padho to kahani yeh hai: ek accommodating shuruaat ko self-direction mein badla. Do lines ka farq hi interesting hai — badlav soch kar hua, majboori se nahi.',
        }
      : undefined,
  };

  return normalizeReport(raw, { language: 'hinglish', mode: 'demo', bothHands: both });
}
