"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type FeedItem = {
  id: number;
  topic: Topic;
  title: string;
  creator: string;
  accent: string;
  form: string;
};

type Topic = "FOOD" | "MUSIC" | "GAMES";

const topicColors: Record<Topic,string> = {
  FOOD:"#d9573f",
  MUSIC:"#7d96d8",
  GAMES:"#c7e764",
};

const feed: FeedItem[] = [
  { id:0, topic:"MUSIC", title:"the headphones that make every song sound better", creator:"@softvolume", accent:"#fff", form:"ink" },
  { id:1, topic:"FOOD", title:"noodles worth learning how to use chopsticks for", creator:"@tinykitchen", accent:"#fff", form:"ink" },
  { id:2, topic:"GAMES", title:"a board game where every path loops back", creator:"@tabletopclub", accent:"#fff", form:"ink" },
  { id:3, topic:"FOOD", title:"three sauces, three completely different dinners", creator:"@tinykitchen", accent:"#fff", form:"ink" },
  { id:4, topic:"MUSIC", title:"the record player I would rescue first", creator:"@listencloser", accent:"#fff", form:"ink" },
  { id:5, topic:"GAMES", title:"cards or dice—which one are you choosing?", creator:"@tabletopclub", accent:"#fff", form:"ink" },
  { id:6, topic:"FOOD", title:"the case for ordering an extra carton of fries", creator:"@foodtheory", accent:"#fff", form:"ink" },
  { id:7, topic:"MUSIC", title:"the drum fill everyone waits for", creator:"@softvolume", accent:"#fff", form:"ink" },
  { id:8, topic:"GAMES", title:"building a tiny kingdom one block at a time", creator:"@playarchive", accent:"#fff", form:"ink" },
  { id:9, topic:"FOOD", title:"the pan that never leaves the stove", creator:"@kitchenedit", accent:"#fff", form:"ink" },
  { id:10, topic:"MUSIC", title:"a tiny radio with surprisingly big sound", creator:"@listencloser", accent:"#fff", form:"ink" },
  { id:11, topic:"GAMES", title:"the handheld game that made the bus ride disappear", creator:"@checkpoint", accent:"#fff", form:"ink" },
  { id:12, topic:"FOOD", title:"a perfectly ordinary—and perfect—dinner plate", creator:"@everydaybites", accent:"#fff", form:"ink" },
  { id:13, topic:"MUSIC", title:"the tiny keyboard that started a whole song", creator:"@songbook", accent:"#fff", form:"ink" },
  { id:14, topic:"GAMES", title:"a chessboard full of questionable decisions", creator:"@tabletopclub", accent:"#fff", form:"ink" },
  { id:15, topic:"FOOD", title:"the pancake stack that is clearly too tall", creator:"@tinykitchen", accent:"#fff", form:"ink" },
  { id:16, topic:"MUSIC", title:"the microphone waiting for your best chorus", creator:"@softvolume", accent:"#fff", form:"ink" },
  { id:17, topic:"GAMES", title:"a tabletop maze with one stubborn marble", creator:"@playarchive", accent:"#fff", form:"ink" },
  { id:18, topic:"FOOD", title:"one rolling pin, three pieces of dough", creator:"@kitchenedit", accent:"#fff", form:"ink" },
  { id:19, topic:"MUSIC", title:"the cassette player making a quiet comeback", creator:"@listencloser", accent:"#fff", form:"ink" },
];

const initialWeights: Record<string,number> = { FOOD:1, MUSIC:1, GAMES:1 };

export default function Home() {
  const [history, setHistory] = useState<number[]>([0]);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [hint, setHint] = useState(true);
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [weights, setWeights] = useState<Record<string,number>>(initialWeights);
  const [burst, setBurst] = useState<{topic:string;remaining:number}|null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(17);
  const [introPhase, setIntroPhase] = useState(0);
  const introRef = useRef<HTMLElement | null>(null);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const analysisRef = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);
  const step = history.length - 1;
  const current = feed[history[step]];
  const previous = feed[history[Math.max(0, step - 1)]];
  const topics = Object.keys(initialWeights) as Topic[];
  const dominantTopic = topics.reduce<Topic|null>((winner,topic) => {
    if(weights[topic] <= 1)return winner;
    if(!winner || weights[topic] > weights[winner])return topic;
    return winner;
  },null);
  const feedTrace = topics.reduce((trace,topic) => ({
    ...trace,
    [topic]:{
      available:feed.filter(item=>item.topic===topic).length,
      shown:history.filter(id=>feed[id].topic===topic).length,
      liked:likedItems.filter(id=>feed[id].topic===topic).length,
    },
  }),{} as Record<Topic,{available:number;shown:number;liked:number}>);

  const chooseNext = () => {
    const unseen = feed.filter((item)=>!history.includes(item.id));
    if (!unseen.length) return null;
    if (burst && burst.remaining > 0) {
      const categoryChoice=unseen.find((item)=>item.topic===burst.topic);
      if(categoryChoice)return categoryChoice.id;
    }
    const nonRepeating=unseen.filter((item)=>item.topic!==current.topic);
    const candidates=nonRepeating.length?nonRepeating:unseen;
    return [...candidates].sort((a,b)=>{
      const scoreA=(a.id*53+shuffleSeed*97+step*31)%101;
      const scoreB=(b.id*53+shuffleSeed*97+step*31)%101;
      return scoreA-scoreB || a.id-b.id;
    })[0].id;
  };

  const advance = () => {
    setHint(false);
    setDirection("up");
    const next=chooseNext();
    if(next!==null){
      setHistory((items)=>[...items,next]);
      if(burst)setBurst((value)=>value?{...value,remaining:Math.max(0,value.remaining-1)}:null);
    }
  };

  const rewind = () => {
    setDirection("down");
    setHistory((items)=>items.length>1?items.slice(0,-1):items);
  };

  const restart = () => {
    setDirection("down");
    setHistory([0]);
    setHint(true);
    setLikedItems([]);
    setWeights(initialWeights);
    setBurst(null);
    setShuffleSeed((value)=>value+37);
  };

  const toggleLike = () => {
    const alreadyLiked=likedItems.includes(current.id);
    setLikedItems((items)=>alreadyLiked?items.filter((id)=>id!==current.id):[...items,current.id]);
    setWeights((scores)=>({...scores,[current.topic]:Math.max(1,scores[current.topic]+(alreadyLiked?-1:1))}));
    if(alreadyLiked){
      if(burst?.topic===current.topic)setBurst(null);
    }else{
      const categoryLikes=likedItems.filter((id)=>feed[id].topic===current.topic).length+1;
      setBurst({topic:current.topic,remaining:categoryLikes*2+1});
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", " "].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowDown" || event.key === " ") advance();
      if (event.key === "ArrowUp") rewind();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, weights, burst, shuffleSeed]);

  useEffect(() => {
    let frame = 0;
    const updateIntro = () => {
      frame = 0;
      const section = introRef.current;
      if (!section) return;
      const progress = Math.max(0, -section.getBoundingClientRect().top / window.innerHeight);
      const nextPhase = progress < .82 ? 0 : progress < 1.75 ? 1 : progress < 2.75 ? 2 : 3;
      setIntroPhase((currentPhase) => currentPhase === nextPhase ? currentPhase : nextPhase);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(updateIntro); };
    updateIntro();
    window.addEventListener("scroll", onScroll, { passive:true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateAnalysis = () => {
      frame = 0;
      const section = analysisRef.current;
      if (!section) return;
      const progress = Math.max(0, -section.getBoundingClientRect().top / window.innerHeight);
      const nextPhase = progress < 1.05 ? 0 : progress < 2.1 ? 1 : progress < 3.15 ? 2 : 3;
      setAnalysisPhase((currentPhase) => currentPhase === nextPhase ? currentPhase : nextPhase);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(updateAnalysis); };
    updateAnalysis();
    window.addEventListener("scroll", onScroll, { passive:true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  return (
    <main className="story-shell">
      <header className="topline">
        <p>WHO KILLED TASTE?</p>
        <p>AN INTERACTIVE INVESTIGATION</p>
      </header>

      <section className="intro" ref={introRef} data-phase={introPhase}>
        <div className="cover-stage">
          <div className={`story-scene cover-scene ${introPhase === 0 ? "active" : ""}`}>
            <p className="eyebrow">STYLE / CULTURE / THE ALGORITHM</p>
            <p className="cover-date">ISSUE 01 · AUG 2026</p>
            <h1><span>Who killed</span><em>taste?</em></h1>
            <p className="cover-kicker">AN INTERACTIVE<br/>INVESTIGATION</p>
            <figure className="museum-cover-art">
              <CoverTasteMotion/>
              <figcaption>DIFFERENT THINGS IN · THE SAME THING OUT</figcaption>
            </figure>
            <div className="article-meta"><span>VOL. 01</span><i /><span>THE FEED</span><b>2026</b></div>
          </div>
          <div className={`story-scene phone-scene ${introPhase === 1 ? "active" : ""}`} aria-hidden="true">
            <div className="scene-phone"><i/><span/><b/></div>
          </div>
          <div className={`story-scene text-scene ${introPhase === 2 ? "active" : ""}`}>
            <div className="article-body intro-step intro-step-one">
            <p><span className="body-copy"><span className="drop-cap">I</span>’m sitting at my desk in a top that TikTok told me to buy and jeans that Instagram sold me after advertising them every five scrolls. My glasses are the same as everyone else’s. They’re the it-girl office-siren glasses, only available on TikTok Shop—don’t you know?</span></p>
            </div>
          </div>
          <div className={`story-scene text-scene ${introPhase === 3 ? "active" : ""}`}>
            <div className="article-body intro-step intro-step-two">
            <p><span className="body-copy">All of this—all of my outfits, my hair color, my bedding—has been selected by the algorithm.</span><strong className="pull-question">In a world of unlimited choice, why are we all still the same?</strong></p>
            </div>
          </div>
        </div>
      </section>

      <section className="analysis-scroll" ref={analysisRef} data-phase={analysisPhase} aria-label="How recommendation systems learn and respond">
        <div className="analysis-stage">
          <div className={`analysis-scene feed-scene ${analysisPhase === 0 ? "active" : ""}`}>
            <div className="scene-editorial-copy"><p>TRY THE FEED</p><h2>The way we spend our time online is largely dictated by social media algorithms.</h2><div>Try our own algorithm to see how they work.</div></div>
            <div className="phone-column">
              <div className="phone" onWheel={(event) => { if (Math.abs(event.deltaY) < 8) return; event.deltaY > 0 ? advance() : rewind(); }} onTouchStart={(event) => { startY.current = event.touches[0].clientY; }} onTouchEnd={(event) => { if (startY.current === null) return; const delta = startY.current - event.changedTouches[0].clientY; if (Math.abs(delta) > 25) delta > 0 ? advance() : rewind(); startY.current = null; }}>
            <div className="phone-top"><span>9:41</span><i /><b>● ● ●</b></div>
            <div className={`video-stage ${direction}`} key={step} style={{ "--video-accent": current.accent } as React.CSSProperties}>
              <AbstractVideo id={current.id} />
              <div className="topic-tag">{current.topic}</div>
              <div className="video-copy"><b>{current.creator}</b><p>{current.title}</p><span>original sound · for you</span></div>
              <div className="social-rail" aria-label="Video actions">
                <button type="button" className={`rail-like ${likedItems.includes(current.id) ? "liked" : ""}`} onClick={toggleLike} aria-label={likedItems.includes(current.id) ? `Unlike this ${current.topic.toLowerCase()} video` : `Like this ${current.topic.toLowerCase()} video`}><b>♥</b><small>{likedItems.includes(current.id) ? "LIKED" : "LIKE"}</small></button>
                <div className="rail-stat" aria-label="742 comments"><b>●</b><small>742</small></div>
                <div className="rail-stat" aria-label="Share"><b>↗</b><small>SHARE</small></div>
              </div>
            </div>
            <div className="next-peek" style={{ background: previous.accent }} />
            <nav className="bottom-nav" aria-label="Feed navigation">
              <button type="button" onClick={rewind} disabled={history.length === 1} aria-label="Go to the previous video"><b>↑</b><span>BACK</span></button>
              <span className="feed-count">{history.length} / 20</span>
              <button type="button" className={hint ? "pulse" : ""} onClick={history.length === feed.length ? restart : advance} aria-label={history.length === feed.length ? "Restart the feed" : "Go to the next video"}><span>{history.length === feed.length ? "AGAIN" : "NEXT"}</span><b>{history.length === feed.length ? "↺" : "↓"}</b></button>
            </nav>
              </div>
              <p className="phone-note">Swipe, use ↑ ↓, or tap the controls</p>
            </div>
          </div>
          <div className={`analysis-scene loop-scene ${analysisPhase === 1 ? "active" : ""}`}>
            <div className="explanation" aria-live="polite">
              <div className="step-heading"><div><p>THE RECOMMENDATION LOOP</p><h2>Here’s how a recommendation loop works.</h2></div></div>
              <RecommendationTree dominantTopic={dominantTopic} />
            </div>
          </div>
          <div className={`analysis-scene graphic-intro-scene ${analysisPhase === 2 ? "active" : ""}`}>
            <GraphicIntroCard embedded number="01" kicker="TIKTOK BOT AUDIT" title="What happens when a feed receives the same signals again and again?" body="Researchers trained automated TikTok accounts to repeatedly like, follow, and rewatch specific topics. The next graphic shows how strongly those behaviors reshaped what the bots were recommended—and why repetition can narrow the material from which taste develops."/>
          </div>
          <div className={`analysis-scene audit-scene ${analysisPhase === 3 ? "active" : ""}`}>
            <TikTokAuditChart />
          </div>
        </div>
      </section>

      <GraphicIntroCard number="02" kicker="SPOTIFY FIELD EXPERIMENT" title="Algorithms can increase our consumption while lessening its diversity." body="The TikTok audit showed how repeated signals can concentrate what a platform places in front of us. A Spotify field experiment found the behavioral consequence of that pattern: personalized recommendations increased how much people streamed, while decreasing the diversity of shows within each listener’s own history. The feed produced more consumption, but less individual variety."/>
      <DiversityStory />
      <GraphicIntroCard number="03" kicker="X FIELD EXPERIMENT" title="What happens when a changed feed begins to shape what comes next?" body="The TikTok audit showed how algorithms can concentrate exposure. The Spotify experiment showed a behavioral result: people consumed more from a less diverse personal mix. The X experiment takes the next step. By randomly assigning users to chronological or algorithmic feeds, researchers tested whether a different information environment could influence later attitudes and account-following behavior—not just what people saw while scrolling."/>
      <XShiftStory feedTrace={feedTrace} dominantTopic={dominantTopic} />

    </main>
  );
}

function CoverTasteMotion(){
  const ref=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const mount=ref.current;if(!mount)return;let cancelled=false,frame=0,renderer:any,hover=0,targetHover=0;const onEnter=()=>{targetHover=1};const onLeave=()=>{targetHover=0};mount.addEventListener("pointerenter",onEnter);mount.addEventListener("pointerleave",onLeave);
    import("three").then(THREE=>{if(cancelled||!ref.current)return;const scene=new THREE.Scene();scene.background=new THREE.Color(0x050505);const camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,.25,9);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff,1.4));const key=new THREE.DirectionalLight(0xffffff,4.5);key.position.set(-4,6,6);scene.add(key);const rim=new THREE.DirectionalLight(0xa9c2d4,2.6);rim.position.set(5,2,-2);scene.add(rim);
      const chrome=new THREE.MeshStandardMaterial({color:0xd9d9d5,roughness:.16,metalness:.9});const cream=new THREE.MeshStandardMaterial({color:0xe9e4d9,roughness:.72,metalness:0});const dark=new THREE.MeshStandardMaterial({color:0x111111,roughness:.68,metalness:.03});
      const rack=new THREE.Group();scene.add(rack);const bar=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,7.6,18),chrome);bar.rotation.z=Math.PI/2;bar.position.y=2.1;rack.add(bar);[-3.75,3.75].forEach(x=>{const post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,4.7,18),chrome);post.position.set(x,-.2,0);rack.add(post);const foot=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.35,16),chrome);foot.rotation.z=Math.PI/2;foot.position.set(x,-2.5,0);rack.add(foot)});
      const outfits:any[]=[];for(let i=0;i<5;i++){
        const g=new THREE.Group();
        const hookCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.56,0),new THREE.Vector3(.02,.78,0),new THREE.Vector3(.18,.86,0),new THREE.Vector3(.25,.73,0)]);g.add(new THREE.Mesh(new THREE.TubeGeometry(hookCurve,24,.018,8,false),chrome));
        const hangerCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.48,.35,0),new THREE.Vector3(0,.62,0),new THREE.Vector3(.48,.35,0),new THREE.Vector3(-.48,.35,0)]);g.add(new THREE.Mesh(new THREE.TubeGeometry(hangerCurve,36,.018,8,false),chrome));
        const jacket=new THREE.Mesh(new THREE.BoxGeometry(.76,1.18,.17),cream);jacket.position.y=-.25;g.add(jacket);
        const shirt=new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.16),dark);shirt.position.set(0,-.17,.13);g.add(shirt);
        [-1,1].forEach(side=>{const pocket=new THREE.Mesh(new THREE.BoxGeometry(.21,.055,.018),dark);pocket.position.set(side*.23,-.48,.19);pocket.rotation.z=side*.04;g.add(pocket);const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.23,1.04,.15),cream);sleeve.position.set(side*.49,-.3,0);sleeve.rotation.z=side*.17;g.add(sleeve);const cuff=new THREE.Mesh(new THREE.BoxGeometry(.24,.075,.165),dark);cuff.position.set(side*.565,-.79,.005);cuff.rotation.z=side*.17;g.add(cuff)});
        const collar=new THREE.Mesh(new THREE.BoxGeometry(.3,.11,.025),cream);collar.position.set(0,.22,.19);g.add(collar);
        const waistband=new THREE.Mesh(new THREE.BoxGeometry(.64,.12,.18),dark);waistband.position.set(0,-.91,0);g.add(waistband);
        [-.2,.2].forEach((x,side)=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.29,1.44,.16),dark);leg.position.set(x,-1.58,0);g.add(leg);const crease=new THREE.Mesh(new THREE.BoxGeometry(.012,1.24,.012),chrome);crease.position.set(x,-1.55,.09);g.add(crease);const hem=new THREE.Mesh(new THREE.BoxGeometry(.3,.055,.17),cream);hem.position.set(x,-2.29,0);g.add(hem);const pleat=new THREE.Mesh(new THREE.BoxGeometry(.012,.27,.012),chrome);pleat.position.set(x+(side===0?.045:-.045),-1.03,.09);g.add(pleat)});
        g.position.set((i-2)*1.38,1.48,0);rack.add(g);outfits.push(g)
      }
      const resize=()=>{const box=mount.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/Math.max(1,box.height);camera.updateProjectionMatrix()};const render=(now=0)=>{hover+=(targetHover-hover)*.025;const align=(Math.sin(now*.0005)+1)/2;rack.rotation.y=Math.sin(now*.00018)*.1;outfits.forEach((g,i)=>{const own=Math.sin(now*.001+i*.95)*(.095+hover*.045);g.rotation.z=THREE.MathUtils.lerp(own,Math.sin(now*.001)*.025,align*(1-hover*.25));g.rotation.y=THREE.MathUtils.lerp(Math.sin(now*.00075+i)*(.14+hover*.035),0,align*(1-hover*.2));const targetX=(i-2)*1.38*(1+hover*.018);g.position.x+=(targetX-g.position.x)*.045;g.position.y=1.48+Math.sin(now*.0011+i*.7)*(.025+hover*.012)});renderer.render(scene,camera);frame=requestAnimationFrame(render)};resize();window.addEventListener("resize",resize);render();});return()=>{cancelled=true;cancelAnimationFrame(frame);mount.removeEventListener("pointerenter",onEnter);mount.removeEventListener("pointerleave",onLeave);renderer?.dispose();if(mount.firstChild)mount.removeChild(mount.firstChild)};
  },[]);
  return <div ref={ref} className="cover-three" role="img" aria-label="Five identical black-and-cream outfits hang from a chrome clothing rack, swaying separately before aligning."/>;
}

function GraphicIntroCard({number,kicker,title,body,embedded=false}:{number:string;kicker:string;title:string;body:string;embedded?:boolean}) {
  const sectionRef=useRef<HTMLElement|null>(null);
  const [visibility,setVisibility]=useState(embedded?1:0);
  useEffect(()=>{
    if(embedded)return;
    let frame=0;
    const update=()=>{frame=0;const el=sectionRef.current;if(!el)return;const rect=el.getBoundingClientRect();const distance=Math.max(1,rect.height-window.innerHeight);const p=Math.max(0,Math.min(1,-rect.top/distance));const opacity=Math.min(1,p/.16,(1-p)/.16);setVisibility(Math.max(0,opacity));};
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update)};update();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);if(frame)cancelAnimationFrame(frame)};
  },[embedded]);
  return <section ref={sectionRef} className={`graphic-intro-section ${embedded?"embedded":"scroll-transition"}`}><article className="graphic-intro-card" style={{opacity:visibility,transform:embedded?"none":`translateY(calc(-50% + ${(1-visibility)*22}px))`}}><header><span>{number}</span><p>{kicker}</p></header><h2>{title}</h2><p>{body}</p></article></section>;
}

function AbstractVideo({ id }: { id:number }) {
  return <div className="illustration-screen" aria-hidden="true"><img src={`/comic-panels/panel-${id}.png?v=7`} alt="" /></div>;
}

function XShiftStory({feedTrace,dominantTopic}:{feedTrace:Record<Topic,{available:number;shown:number;liked:number}>;dominantTopic:Topic|null}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [phase,setPhase] = useState(0);
  const beats = [
    {k:"THE EXPOSURE",h:"The For You feed showed more content from the political right.",p:"Researchers randomly assigned 4,965 active U.S. X users to chronological or algorithmic feeds for seven weeks. The feeds did not deliver the same political environment."},
    {k:"THE SHIFT",h:"Several measured opinions moved to the right.",p:"The changes were modest averages—not a wholesale conversion—but they appeared across policy priorities and views of major political events."},
    {k:"THE AFTEREFFECT",h:"A recommendation became a lasting connection.",p:"Users exposed to the algorithm followed more conservative activist accounts. Those accounts remained after the algorithm was switched off."},
  ];

  useEffect(()=>{
    let frame=0;
    const update=()=>{
      frame=0;
      const section=sectionRef.current;if(!section)return;
      const progress=Math.max(0,-section.getBoundingClientRect().top/window.innerHeight);
      const next=progress<1.25?0:progress<2.5?1:2;
      setPhase(current=>current===next?current:next);
    };
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
    update();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);
    return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);if(frame)cancelAnimationFrame(frame)};
  },[]);

  useEffect(()=>{
    if(!svgRef.current||!wrapRef.current)return;
    const draw=()=>{
      const width=Math.max(520,wrapRef.current?.clientWidth||900),height=Math.max(460,Math.min(690,window.innerHeight*.74));
      const svg=d3.select(svgRef.current).attr("viewBox",`0 0 ${width} ${height}`);svg.selectAll("*").interrupt().remove();
      const left=width*.31,right=width*.72,mid=width*.515,top=105;
      svg.append("line").attr("x1",mid).attr("x2",mid).attr("y1",58).attr("y2",height-46).attr("class","x-divider");
      [[left,"FOLLOWING","CHRONOLOGICAL"],[right,"FOR YOU","ALGORITHMIC"]].forEach(([x,a,b])=>{
        svg.append("text").attr("x",x as number).attr("y",32).attr("text-anchor","middle").attr("class","x-feed-name").text(a as string);
        svg.append("text").attr("x",x as number).attr("y",49).attr("text-anchor","middle").attr("class","x-feed-type").text(b as string);
      });
      const dots=d3.range(84).map(i=>({i,side:i%2,band:(i*17)%21,jitter:((i*37)%19)-9}));
      const group=svg.append("g");
      group.selectAll("circle").data(dots).join("circle").attr("r",3.3).attr("class",d=>`x-person side-${d.side}`)
        .attr("cx",d=>d.side?right:left).attr("cy",d=>top+(d.i%42)*7.8)
        .transition().duration(800).ease(d3.easeCubicInOut)
        .attr("cx",d=>{
          const base=d.side?right:left;
          if(phase<2)return base+d.jitter*1.25;
          return base+(d.side?width*.075:width*.006)+d.jitter*1.35;
        });
      if(phase===0){
        svg.append("text").attr("x",width/2).attr("y",height-22).attr("text-anchor","middle").attr("class","x-caption").text("RANDOM ASSIGNMENT · COMPARABLE GROUPS AT THE START");
      }
      if(phase>=1){
        const barY=height-108;
        [{x:left,label:"CONSERVATIVE ACCOUNTS",value:"REFERENCE",w:width*.12,color:"#77736d"},{x:right,label:"CONSERVATIVE ACCOUNTS",value:"+60%",w:width*.20,color:"#a64b3f"}].forEach(d=>{
          svg.append("rect").attr("x",d.x-d.w/2).attr("y",barY).attr("width",d.w).attr("height",9).attr("fill",d.color);
          svg.append("text").attr("x",d.x).attr("y",barY-10).attr("text-anchor","middle").attr("class","x-bar-label").text(d.label);
          svg.append("text").attr("x",d.x).attr("y",barY+28).attr("text-anchor","middle").attr("class","x-bar-value").text(d.value);
        });
        svg.append("text").attr("x",right).attr("y",barY+47).attr("text-anchor","middle").attr("class","x-activist-note").text("+28% POSTS FROM CONSERVATIVE ACTIVISTS");
      }
      if(phase>=2){
        const axisY=height-38;
        svg.append("line").attr("x1",width*.12).attr("x2",width*.9).attr("y1",axisY).attr("y2",axisY).attr("class","x-ideology-axis");
        svg.append("text").attr("x",width*.12).attr("y",axisY-10).attr("class","x-axis-word").text("LEFT");
        svg.append("text").attr("x",width*.9).attr("y",axisY-10).attr("text-anchor","end").attr("class","x-axis-word right").text("RIGHT");
        svg.append("path").attr("d",`M${right-width*.01},${height*.48} C${right+width*.04},${height*.48} ${right+width*.06},${height*.48} ${right+width*.09},${height*.48}`).attr("class","x-shift-arrow");
        svg.append("text").attr("x",right+width*.04).attr("y",height*.48-13).attr("text-anchor","middle").attr("class","x-shift-label").text("MEASURED RIGHTWARD SHIFT");
      }
      if(phase>=3){
        const accounts=[height*.28,height*.39,height*.5,height*.61];
        accounts.forEach((y,i)=>{
          const ax=width*.94;
          svg.append("circle").attr("cx",ax).attr("cy",y).attr("r",8).attr("class","x-account");
          svg.append("path").attr("d",`M${right+20},${top+((i*9+5)%42)*7.8} C${width*.84},${top+((i*9+5)%42)*7.8} ${width*.87},${y} ${ax-10},${y}`).attr("class","x-follow-line");
        });
        svg.append("text").attr("x",width*.94).attr("y",height*.69).attr("text-anchor","middle").attr("class","x-follow-label").text("NEW FOLLOWS PERSIST");
      }
    };
    draw();let resizeFrame=0;const onResize=()=>{if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(draw)};
    window.addEventListener("resize",onResize);return()=>{window.removeEventListener("resize",onResize);if(resizeFrame)cancelAnimationFrame(resizeFrame)};
  },[phase]);

  return <section className="x-shift-story" ref={sectionRef} data-phase={phase}>
    <div className="x-shift-stage">
      <div className="x-story-copy">
        <header><span>03</span><p>X &amp; POLITICAL EXPOSURE</p><small>{String(phase+1).padStart(2,"0")} / 03</small></header>
        <p className="x-kicker">{beats[phase].k}</p><h2>{beats[phase].h}</h2><p className="x-body">{beats[phase].p}</p>
        {phase===2&&<p className="x-caveat"><b>The boundary:</b> The experiment did not significantly change party identification or affective polarization. It measured shifts in specific opinions and behavior.</p>}
      </div>
      <div className="x-chart clean-x-chart" aria-live="polite">
        {phase===0&&<div className="feed-comparison">
          <div className="feed-column"><p>FOLLOWING <span>chronological</span></p><div className="post-stack neutral">{d3.range(8).map(i=><i key={i}/>)}</div><small>REFERENCE LEVEL</small></div>
          <div className="feed-column"><p>FOR YOU <span>algorithmic</span></p><div className="post-stack tilted">{d3.range(8).map(i=><i key={i} className={i<5?"right-post":""}/>)}</div><strong>+60%</strong><small>POSTS FROM CONSERVATIVE ACCOUNTS</small><b>+28% from conservative activists</b></div>
        </div>}
        {phase===1&&<div className="outcome-plot">
          <div className="outcome-axis"><span>MORE LIBERAL</span><i>NO CHANGE</i><span>MORE CONSERVATIVE</span></div>
          {["Policy priorities","Trump investigations","Views on Ukraine"].map((label,i)=><div className="outcome-row" key={label}><b>{label}</b><div><i/><span style={{left:`${61+i*6}%`}}/></div><em>shifted right</em></div>)}
          <p>Average change after seven weeks of algorithmic exposure</p>
        </div>}
        {phase===2&&<article className="x-conclusion-card final-conclusion"><p>CONCLUSION</p><div><p>It’s easy to dismiss social media as something that only affects us online. But algorithms have consequences that follow us into the real world. The data doesn’t suggest that an algorithm can invent every preference we have. It shows something more subtle: algorithms can make us consume more, choose from a narrower range, and sometimes influence what we believe or do next.</p><p>I’m still the one buying the glasses, playing the podcast, and following the account. But I’m making those choices inside a world that has already been sorted for me. Algorithms don’t have to tell us what to like. They only have to keep showing us the same things until those things begin to shape what we like.</p><TasteTrace trace={feedTrace} dominantTopic={dominantTopic}/></div></article>}
      </div>
      <a className="x-source" href="https://doi.org/10.1038/s41586-026-10098-2" target="_blank" rel="noreferrer">Source: Gauthier et al., Nature (2026) ↗</a>
    </div>
  </section>;
}

function TasteTrace({trace,dominantTopic}:{trace:Record<Topic,{available:number;shown:number;liked:number}>;dominantTopic:Topic|null}) {
  const totalShown=Object.values(trace).reduce((sum,value)=>sum+value.shown,0);
  const totalLiked=Object.values(trace).reduce((sum,value)=>sum+value.liked,0);
  return <aside className="taste-trace" aria-label="How the interactive feed responded to your activity">
    <header><span>YOUR FEED, REVEALED</span><p>{dominantTopic?`Your strongest signal was ${dominantTopic.toLowerCase()}. The feed used it to decide what appeared next.`:"The feed was ready to adapt, but you did not leave a strong category signal."}</p></header>
    <div className="taste-trace-head"><span>Category</span><span>Available</span><span>Shown</span><span>Liked</span></div>
    {(Object.keys(trace) as Topic[]).map(topic=><div className={`taste-trace-row ${topic===dominantTopic?"dominant":""}`} key={topic} style={{"--trace-color":topicColors[topic]} as React.CSSProperties}><b><i/>{topic}</b><span>{trace[topic].available}</span><span>{trace[topic].shown}</span><span>{trace[topic].liked}</span></div>)}
    <small>This reflects only your activity in this story: {totalShown} post{totalShown===1?"":"s"} shown and {totalLiked} liked. It is a demonstration, not a measurement of your taste.</small>
  </aside>;
}

function DiversityStory() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotifyPhaseRef = useRef(0);
  const spotifyPhaseStartedRef = useRef(0);
  const [phase, setPhase] = useState(0);
  const labels=["COMEDY","NEWS","CULTURE","SPORT","MUSIC","HISTORY","FICTION"];
  const captions=["BEFORE THE ALGORITHM","AFTER THE ALGORITHM","MORE LISTENING, LESS VARIETY"];

  useEffect(() => {
    spotifyPhaseRef.current=phase;
    spotifyPhaseStartedRef.current=performance.now();
  },[phase]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const progress = Math.max(0, -section.getBoundingClientRect().top / window.innerHeight);
      const next = Math.min(2,Math.floor(progress/1.05));
      setPhase(current => current === next ? current : next);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",onScroll);
    return () => { window.removeEventListener("scroll",onScroll); window.removeEventListener("resize",onScroll); if(frame)cancelAnimationFrame(frame); };
  },[]);

  useEffect(() => {
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    const colors=["#ef5f49","#f2a43a","#e5d33d","#62a867","#4698b4","#607ac1","#b45ca5"];
    const nodes=d3.range(90).map(i=>({i,category:i%7,x:0,y:0}));
    let raf=0,w=0,h=0;
    const resize=()=>{const box=canvas.getBoundingClientRect();const ratio=Math.min(devicePixelRatio,2);w=box.width;h=box.height;canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0)};
    const target=(n:typeof nodes[number])=>{
      const current=spotifyPhaseRef.current;
      const cols=w<650?10:15,cell=Math.min(34,(w*.78)/cols),left=w*.11;
      if(current<2){const index=Math.min(n.i,69);return [left+(index%cols)*cell,h*.3+Math.floor(index/cols)*cell];}
      return [left+(n.i%cols)*cell,h*.24+Math.floor(n.i/cols)*cell];
    };
    const draw=()=>{const current=spotifyPhaseRef.current,now=performance.now();ctx.clearRect(0,0,w,h);ctx.fillStyle="#f3eee4";ctx.fillRect(0,0,w,h);nodes.forEach(n=>{const [tx,ty]=target(n);if(!n.x){n.x=w*.11+(n.i%15)*24;n.y=h*.3+Math.floor(n.i/15)*24}n.x+=(tx-n.x)*.075;n.y+=(ty-n.y)*.075;const visible=current<2?n.i<70:true;if(!visible){ctx.globalAlpha=0;return}let pop=1;if(current===2&&n.i>=70){const delay=(n.i-70)*42;const t=Math.max(0,Math.min(1,(now-spotifyPhaseStartedRef.current-delay)/520));pop=d3.easeBackOut.overshoot(2.2)(t)}ctx.globalAlpha=Math.min(1,pop);const shiftT=current===0?0:Math.max(0,Math.min(1,(now-spotifyPhaseStartedRef.current-(n.i%10)*34)/850));const targetColor=colors[n.i%2];const color=d3.interpolateRgb(colors[n.category],targetColor)(d3.easeCubicInOut(shiftT));const size=24*Math.max(0,pop);const bob=current===2&&n.i>=70?Math.sin(Math.min(1,pop)*Math.PI)*-18:0;ctx.save();ctx.translate(n.x,n.y+bob);ctx.fillStyle=color;ctx.strokeStyle="#171712";ctx.lineWidth=1.2;ctx.fillRect(-size/2,-size/2,size,size);ctx.strokeRect(-size/2,-size/2,size,size);if(size>8){ctx.fillStyle="rgba(255,255,255,.72)";ctx.fillRect(-size*.28,-size*.16,size*.56,2);ctx.fillRect(-size*.28,size*.02,size*.38,2)}ctx.restore()});ctx.globalAlpha=1;raf=requestAnimationFrame(draw)};
    resize();draw();window.addEventListener("resize",resize);return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize)};
  },[]);

  return <section className="diversity-story" ref={sectionRef} data-phase={phase}>
    <div className="diversity-stage diversity-text-stage spotify-cloud-stage">
      <div className="spotify-cloud-copy"><span>SPOTIFY FIELD EXPERIMENT</span><h2>{captions[phase]}</h2><p>{phase===0?"Each tile represents something in one listener’s podcast history. Color distinguishes different kinds of listening.":phase===1?"With personalized recommendations, the same field begins to repeat a narrower set of categories.":"More recommendations enter the history, but most now come from the same limited range."}</p><div className="spotify-side-stats"><div><strong>+28.90%</strong><b>more podcast streams</b><small>Personalized recommendations increased how much listeners played.</small></div><div><strong>−11.51%</strong><b>within-person diversity</b><small>Each listener’s own podcast history became less varied.</small></div></div></div>
      <div className="spotify-cloud-viz"><div className="spotify-before-after">{phase===0?"BEFORE THE ALGORITHM":"AFTER THE ALGORITHM"}</div><div className="spotify-cloud-legend">{labels.map((label,i)=><span key={label}><i style={{background:["#ef5f49","#f2a43a","#e5d33d","#62a867","#4698b4","#607ac1","#b45ca5"][i]}}/>{label}</span>)}</div><canvas ref={canvasRef} role="img" aria-label="A varied podcast history changes to mostly red and yellow after personalization, then additional recommendations pop into the history."/></div>
      <p className="diversity-note">Spotify field experiment on personalized podcast recommendations.</p>
    </div>
  </section>;
}

function SpotifyPlaylistMachines({phase}:{phase:number}){
  const mountRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    let cancelled=false;let instance:{remove:()=>void}|null=null;
    import("p5").then(({default:P5})=>{
      if(cancelled||!mountRef.current)return;
      instance=new P5((p:any)=>{
        const rainbow=[[255,77,60],[255,174,25],[224,224,30],[55,186,91],[30,174,210],[57,102,224],[190,65,185]];const narrow=[[255,77,60],[57,102,224]];
        const size=()=>[mountRef.current?.clientWidth||760,mountRef.current?.clientHeight||550];
        p.setup=()=>{const [w,h]=size();const canvas=p.createCanvas(w,h);canvas.parent(mountRef.current);p.pixelDensity(Math.min(window.devicePixelRatio,2));p.textFont("Arial")};
        const machine=(cx:number,label:string,colors:number[][],cards:number,speed:number)=>{const boxW=p.width*.30,boxH=p.height*.20,top=p.height*.09;const sleeve=Math.min(boxW*.34,p.height*.115);const drawRecord=(x:number,y:number,color:number[],angle=0)=>{p.push();p.translate(x,y);p.rotate(angle);p.fill(...color);p.stroke(20);p.strokeWeight(1.7);p.rect(-sleeve/2,-sleeve/2,sleeve,sleeve,2);p.fill(16);p.circle(sleeve*.12,0,sleeve*.68);p.fill(...color);p.circle(sleeve*.12,0,sleeve*.18);p.fill(244,239,230);p.circle(sleeve*.12,0,3);p.pop()};p.stroke(20);p.strokeWeight(2);p.fill(244,239,230);p.rect(cx-boxW/2,top,boxW,boxH,4);p.fill(20);p.noStroke();p.textAlign(p.CENTER,p.CENTER);p.textStyle(p.BOLD);p.textSize(Math.max(9,p.width*.011));p.text(label,cx,top+boxH*.25);p.fill(20);p.rect(cx-boxW*.22,top+boxH*.55,boxW*.44,10,2);p.noFill();p.stroke(20);p.circle(cx+boxW*.34,top+boxH*.24,18);const stackBottom=p.height*.76;for(let i=0;i<cards;i++){const y=stackBottom-i*sleeve*.19;drawRecord(cx+(i%3-1)*3,y,colors[i%colors.length],(i%3-1)*.018)}for(let f=0;f<2;f++){const raw=(p.frameCount*speed+f*.5)%1;const eased=raw<.5?2*raw*raw:1-Math.pow(-2*raw+2,2)/2;const startY=top+boxH*.7,endY=stackBottom-cards*sleeve*.19-sleeve*.3;const next=(Math.floor(p.frameCount*speed)+f)%colors.length;drawRecord(cx,p.lerp(startY,endY,eased),colors[next],p.lerp(-.04,.02,eased))}};
        p.draw=()=>{p.clear();machine(p.width*.27,"WITHOUT ALGORITHM",rainbow,10,.012);machine(p.width*.73,"WITH ALGORITHM",narrow,13,.023)};
        p.windowResized=()=>{const [w,h]=size();p.resizeCanvas(w,h)};
      },mountRef.current);
    });return()=>{cancelled=true;instance?.remove()};
  },[phase]);
  return <div className={`spotify-machines phase-${phase}`} ref={mountRef} role="img" aria-label="Two playlist machines. Without personalization, ten large track cards appear in seven colors. With personalization, thirteen cards arrive faster but repeat only two colors."><div className="machine-stat machine-stat-left"><strong>LESS LISTENING</strong><span>more variety</span></div><div className="machine-stat machine-stat-right"><strong>+28.90% MORE</strong><span>−11.51% diversity</span></div></div>;
}

function SpotifyListenerComparison({phase}:{phase:number}){
  const mountRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    let cancelled=false;let instance:{remove:()=>void}|null=null;
    import("p5").then(({default:P5})=>{
      if(cancelled||!mountRef.current)return;
      instance=new P5((p:any)=>{
        const rainbow=[[239,111,85],[230,170,62],[199,207,82],[103,164,110],[88,163,184],[111,132,184],[163,109,156]];const narrow=[[239,111,85],[111,132,184]];
        const size=()=>[mountRef.current?.clientWidth||700,mountRef.current?.clientHeight||520];
        p.setup=()=>{const [w,h]=size();const canvas=p.createCanvas(w,h);canvas.parent(mountRef.current);p.pixelDensity(Math.min(window.devicePixelRatio,2));p.noFill();p.strokeCap(p.ROUND)};
        const headphones=(cx:number,cy:number,r:number)=>{p.stroke(20);p.strokeWeight(Math.max(3,r*.075));p.arc(cx,cy,r*1.25,r*1.3,p.PI,p.TWO_PI);p.fill(20);p.noStroke();p.rect(cx-r*.69,cy-r*.08,r*.22,r*.55,r*.08);p.rect(cx+r*.47,cy-r*.08,r*.22,r*.55,r*.08);p.noFill()};
        const waves=(side:number,count:number,colors:number[][],time:number)=>{const startX=side<0?p.width*.31:p.width*.66,endX=side<0?p.width*.49:p.width*.51;const centerY=p.height*.22;for(let i=0;i<count;i++){const color=colors[i%colors.length];p.stroke(...color,phase===0?(side<0?235:145):(side>0?235:145));p.strokeWeight(side>0?2.4:2);p.beginShape();for(let j=0;j<=60;j++){const t=j/60;const x=p.lerp(startX,endX,t);const spread=(i-(count-1)/2)*(side>0?5.5:7);const y=centerY+spread+Math.sin(t*15-time*(side>0?2.8:1.9)+i*.68)*(3+t*8);p.vertex(x,y)}p.endShape()}};
        p.draw=()=>{p.clear();const time=p.frameCount*.035;waves(-1,7,rainbow,time);waves(1,13,narrow,time);const r=Math.min(p.width,p.height)*.15;headphones(p.width*.255,p.height*.19,r);headphones(p.width*.715,p.height*.19,r)};
        p.windowResized=()=>{const [w,h]=size();p.resizeCanvas(w,h)};
      },mountRef.current);
    });return()=>{cancelled=true;instance?.remove()};
  },[phase]);
  return <div className={`spotify-tunnel listener-comparison p5-listeners phase-${phase}`} ref={mountRef} role="img" aria-label="Two illustrated listeners. The listener without personalization has seven differently colored audio tracks. The listener with personalization has thirteen audio tracks in only two colors."><div className="listener-label listener-left"><span>WITHOUT ALGORITHM</span><strong>More colors</strong><small>a wider mix of listening</small></div><div className="listener-label listener-right"><span>WITH ALGORITHM</span><strong>More tracks</strong><small>+28.90% streams · −11.51% diversity</small></div></div>;
}

function SpotifyTunnel({phase}:{phase:number}){
  const mountRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    let cancelled=false;let frame=0;let cleanup=()=>{};
    import("three").then(THREE=>{
      if(cancelled||!mountRef.current)return;
      const mount=mountRef.current;
      const scene=new THREE.Scene();
      const camera=new THREE.OrthographicCamera(-5,5,3.25,-3.25,.1,30);camera.position.z=10;
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));mount.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff,2));const key=new THREE.DirectionalLight(0xffffff,2.8);key.position.set(0,4,8);scene.add(key);
      const allObjects=new THREE.Group();scene.add(allObjects);
      const makeHeadphones=(x:number)=>{const group=new THREE.Group();const points=[];for(let i=0;i<=24;i++){const a=Math.PI-(i/24)*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*.63,Math.sin(a)*.68,0))}const curve=new THREE.CatmullRomCurve3(points);const band=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.075,8,false),new THREE.MeshStandardMaterial({color:0x171717,roughness:.32,metalness:.45}));group.add(band);[-.66,.66].forEach(side=>{const cup=new THREE.Mesh(new THREE.BoxGeometry(.19,.48,.18),new THREE.MeshStandardMaterial({color:0x171717,roughness:.28,metalness:.38}));cup.position.set(side,-.05,.02);cup.rotation.z=side<0?-.08:.08;group.add(cup)});group.position.set(x,2.15,.2);allObjects.add(group);return group};
      const leftHeadphones=makeHeadphones(-2.55),rightHeadphones=makeHeadphones(2.55);
      const rainbow=[0xef6f55,0xe6aa3e,0xc7cf52,0x67a46e,0x58a3b8,0x6f84b8,0xa36d9c];const narrow=[0xef6f55,0x6f84b8];
      const tracks:{line:any;side:number;index:number;baseY:number}[]=[];
      const addTracks=(side:number,count:number,colors:number[])=>{for(let i=0;i<count;i++){const geometry=new THREE.BufferGeometry();const positions=new Float32Array(54*3);geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));const material=new THREE.LineBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:.92});const line=new THREE.Line(geometry,material);allObjects.add(line);tracks.push({line,side,index:i,baseY:2.05+(i-(count-1)/2)*.105})}};
      addTracks(-1,7,rainbow);addTracks(1,13,narrow);
      let pointer=0;const onPointer=(event:PointerEvent)=>{const rect=mount.getBoundingClientRect();pointer=((event.clientX-rect.left)/rect.width-.5)*.12};mount.addEventListener("pointermove",onPointer);
      const resize=()=>{if(!mountRef.current)return;const w=mountRef.current.clientWidth,h=mountRef.current.clientHeight;renderer.setSize(w,h,false);const aspect=w/Math.max(h,1);camera.left=-3.25*aspect;camera.right=3.25*aspect;camera.top=3.25;camera.bottom=-3.25;camera.updateProjectionMatrix()};resize();window.addEventListener("resize",resize);
      const render=(now=performance.now())=>{const time=now*.002;tracks.forEach(track=>{const positions=track.line.geometry.attributes.position.array as Float32Array;for(let j=0;j<54;j++){const t=j/53;const startX=track.side<0?-2.05:2.05;const endX=track.side<0?-.18:.18;positions[j*3]=startX+(endX-startX)*t;positions[j*3+1]=track.baseY+Math.sin(t*15-time*2.4+track.index*.72)*(.045+t*.075);positions[j*3+2]=.1+Math.sin(t*9+track.index)*.035}track.line.geometry.attributes.position.needsUpdate=true});leftHeadphones.rotation.z=Math.sin(time*.8)*.018+pointer;rightHeadphones.rotation.z=-Math.sin(time*.85)*.018+pointer;renderer.render(scene,camera);frame=requestAnimationFrame(render)};render();
      cleanup=()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",resize);mount.removeEventListener("pointermove",onPointer);allObjects.traverse((obj:any)=>{obj.geometry?.dispose();obj.material?.dispose()});renderer.dispose();renderer.domElement.remove()};
    });
    return()=>{cancelled=true;cleanup()};
  },[phase]);
  return <div className="spotify-tunnel listener-comparison" ref={mountRef} role="img" aria-label="Two illustrated listeners wearing three-dimensional headphones. The listener without personalization has seven differently colored tracks; the listener with personalization has more tracks but only two colors.">
    <div className="listener-label listener-left"><span>WITHOUT ALGORITHM</span><strong>7 colors</strong><small>more variety</small></div><div className="listener-label listener-right"><span>WITH ALGORITHM</span><strong>13 tracks</strong><small>more listening · only 2 colors</small></div>
  </div>;
}

function AudioWaveTexture({phase}:{phase:number}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  useEffect(()=>{
    let cancelled=false;
    let instance:{remove:()=>void}|null=null;
    import("p5").then(({default:P5})=>{
      if(cancelled || !mountRef.current)return;
      instance=new P5((p:any)=>{
        p.setup=()=>{const canvas=p.createCanvas(mountRef.current?.clientWidth||600,mountRef.current?.clientHeight||420);canvas.parent(mountRef.current);p.pixelDensity(1)};
        p.draw=()=>{
          p.clear();
          const layers=phase===2?5:phase===0?3:2;
          const amplitude=phase===0?25:phase===1?10:16;
          for(let layer=0;layer<layers;layer++){
            p.noFill();p.stroke(23,23,18,22+layer*6);p.strokeWeight(1);
            p.beginShape();
            for(let x=0;x<=p.width;x+=6){
              const y=p.height*.5+Math.sin(x*.018+p.frameCount*.018+layer*1.4)*amplitude*(1-layer*.1)+Math.sin(x*.043-layer)*5;
              p.vertex(x,y);
            }
            p.endShape();
          }
        };
        p.windowResized=()=>p.resizeCanvas(mountRef.current?.clientWidth||600,mountRef.current?.clientHeight||420);
      },mountRef.current);
    });
    return()=>{cancelled=true;instance?.remove()};
  },[phase]);
  return <div className="audio-p5" ref={mountRef} aria-hidden="true"/>;
}

function RecommendationTree({dominantTopic}:{dominantTopic:Topic|null}) {
  const [phase, setPhase] = useState(0);
  const treeSvgRef = useRef<SVGSVGElement | null>(null);
  const phaseDurations = [500,900,500,1000,500,1000,500,750,1100];
  useEffect(() => {
    const timer = window.setTimeout(() => setPhase(value => (value + 1) % phaseDurations.length), phaseDurations[phase]);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (!treeSvgRef.current) return;
    const svg = d3.select(treeSvgRef.current);
    svg.selectAll(".moving-dot").interrupt().remove();
    const signalColor=dominantTopic?topicColors[dominantTopic]:"#d9573f";
    const branchColors=dominantTopic?[signalColor,signalColor,signalColor]:["#7d96d8","#f2a247","#c7e764"];
    const motionByPhase:Record<number,{names:string[];colors:string[]}> = {
      1:{names:["behavior"],colors:[signalColor]},
      3:{names:["out-0","out-1","out-2"],colors:branchColors},
      5:{names:["in-0","in-1","in-2"],colors:branchColors},
      7:{names:["feed"],colors:[signalColor]},
    };
    const motion = motionByPhase[phase];
    if (!motion) return;
    motion.names.forEach((name,index) => {
      const path = svg.select<SVGPathElement>(`path[data-motion="${name}"]`).node();
      if (!path) return;
      const length = path.getTotalLength();
      const start = path.getPointAtLength(0);
      svg.append("circle").attr("class","moving-dot").attr("r",5)
        .attr("fill",motion.colors[index]).attr("stroke","#161712").attr("stroke-width",2)
        .attr("transform",`translate(${start.x},${start.y})`)
        .transition().duration(phaseDurations[phase] - 25).ease(d3.easeLinear)
        .attrTween("transform",() => (t:number) => { const point=path.getPointAtLength(t*length); return `translate(${point.x},${point.y})`; });
    });
  }, [phase,dominantTopic]);
  const branches = {
    SIMILAR:{ out:"M300 174 C300 218 92 205 92 250", in:"M92 312 C92 352 300 330 300 360" },
    POPULAR:{ out:"M300 174 L300 250", in:"M300 312 L300 360" },
    EXPLORE:{ out:"M300 174 C300 218 508 205 508 250", in:"M508 312 C508 352 300 330 300 360" },
  };
  return (
    <div className="algo-tree" aria-label="Animated recommendation flow chart">
      <p className="tree-title">A SIMPLIFIED RECOMMENDATION LOOP</p>
      <svg ref={treeSvgRef} className="tree-lines" viewBox="0 0 600 510" role="img" aria-label="A behavior signal reaches the scoring step, then signals move to three candidate sources, converge at ranking, and proceed to the next feed.">
        <path data-motion="behavior" d="M300 54 L300 112" />
        {Object.entries(branches).map(([topic,path],index) => <g key={topic}><path data-motion={`out-${index}`} d={path.out} /><path data-motion={`in-${index}`} d={path.in} /></g>)}
        <path data-motion="feed" d="M300 422 L300 460" />
      </svg>
      <div className={`tree-node user-node ${phase === 0 ? "is-active" : ""}`}><span>01</span><b>YOUR BEHAVIOR</b><small>watch · skip · like · share</small></div>
      <div className={`tree-node record-node ${phase === 2 ? "is-active" : ""}`}><span>02</span><b>SIGNALS BECOME SCORES</b><small>the system estimates what may keep you watching</small></div>
      <div className={`tree-node topic-node food ${phase === 4 ? "is-active" : ""}`}><b>SIMILAR</b><small>more like past choices</small></div>
      <div className={`tree-node topic-node music ${phase === 4 ? "is-active" : ""}`}><b>POPULAR</b><small>content engaging others</small></div>
      <div className={`tree-node topic-node games ${phase === 4 ? "is-active" : ""}`}><b>EXPLORE</b><small>test something different</small></div>
      <div className={`tree-node rank-node ${phase === 6 ? "is-active" : ""}`}><span>03</span><b>RANK + MIX</b><small>candidate videos are ordered</small></div>
      <div className={`tree-node feed-node ${phase === 8 ? "is-active" : ""}`}><span>04</span><b>NEXT FEED</b><small>the ranked selection reaches you</small></div>
    </div>
  );
}

function TikTokAuditChart() {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current || !wrapRef.current) return;
    const draw = () => {
      const width = Math.max(300, wrapRef.current?.clientWidth ?? 700);
      const height = 120;
      const gap = width < 500 ? 1 : 2;
      const markWidth = (width - gap * 99) / 100;
      const svg = d3.select(chartRef.current).attr("viewBox", `0 0 ${width} ${height}`);
      svg.selectAll("*").remove();
      const root = svg.append("g").attr("transform","translate(0,34)");
      root.selectAll("rect").data(d3.range(100)).join("rect")
        .attr("x", d => d * (markWidth + gap)).attr("y",42)
        .attr("width",Math.max(1,markWidth)).attr("height",0)
        .attr("fill", d => d < 67 ? "#6f84b8" : "#d8d3ca")
        .transition().delay(d => d * 4).duration(450).ease(d3.easeCubicOut)
        .attr("y",0).attr("height",42);
      const splitX = 67 * (markWidth + gap) - gap/2;
      root.append("line").attr("x1",splitX).attr("x2",splitX).attr("y1",-24).attr("y2",52).attr("class","audit-split");
      root.append("text").attr("x",0).attr("y",72).attr("class","audit-direct-label aligned").text("≈67% INTEREST-ALIGNED");
      root.append("text").attr("x",width).attr("y",72).attr("text-anchor","end").attr("class","audit-direct-label other").text("≈33% SOMETHING ELSE");
    };
    draw();
    let resizeFrame=0;
    const onResize=()=>{if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(draw)};
    window.addEventListener("resize",onResize);
    return () => {window.removeEventListener("resize",onResize);if(resizeFrame)cancelAnimationFrame(resizeFrame)};
  }, []);

  return (
    <section className="audit-section" aria-labelledby="audit-title">
      <div className="audit-heading">
        <p className="eyebrow">TIKTOK AUDIT / 2026</p>
        <h2 id="audit-title">In the strongest observed cases, about <em>2 in 3 videos</em> matched the bot’s assigned interest.</h2>
      </div>
      <div className="audit-chart-wrap" ref={wrapRef}>
        <svg ref={chartRef} role="img" aria-label="One hundred video marks: approximately 67 are interest-aligned and 33 show something else." />
        <p className="audit-annotation"><b>Repeated signals reshaped the feed.</b> About two-thirds of recommendations matched the interest the bot repeatedly reinforced. The remaining third still introduced other material.</p>
        <p className="audit-caution">The study ran 42 automated bot experiments: 14 runs each for Gaming, Food, and Gaming plus Food. Bots liked, rewatched, and followed every matching video. The experiment shows how TikTok responded under those controlled conditions; it does not establish what a typical person sees, whether the same pattern applies to other topics, or whether personalization is beneficial or harmful.</p>
        <a href="https://link.springer.com/article/10.1140/epjds/s13688-026-00629-2" target="_blank" rel="noreferrer">Source: Baumann et al., EPJ Data Science (2026) ↗</a>
      </div>
    </section>
  );
}
