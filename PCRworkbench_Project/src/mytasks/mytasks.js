/* mytasks: task list + detail workspace */
/* ══════════ 任务视图渲染逻辑 ══════════ */

const CHK='<svg class="i" style="width:11px;height:11px;stroke-width:2.4"><path d="M2.5 8l3.5 3.5 7-8"/></svg>';
const WRN='!'; const ERR='×';

/* ---------- data ---------- */
const TASKS={
  t1:{type:'vote',tt:'VOTE',ttl:'CPU 换代 · 请对开发影响投票',pcr:'PCR-2026-08871',status:'In Progress',
      product:'ThinkPad X1 Carbon Gen 13',func:'Development / RD',mandatory:true,critical:false,due:'今日到期',late:false,
      change:'Replace Intel Core Ultra 7 155U with Ultra 7 165U, covering all GEO main MTMs; no hardware changes to motherboard power supply and cooling; need to confirm BIOS and certification impact.',
      name:'X1 Carbon G13 CPU Ultra 165U Replacement',geo:'WW',date:'2026-11-15',stage:'Implementation',progress:30,risk:'high'},
  t2:{type:'vote',tt:'VOTE',ttl:'BOM 变更 · 内存颗粒替代投票',pcr:'CP-2026-04412',status:'Voting',
      product:'ThinkCentre M90q Gen6',func:'Development / RD',mandatory:true,critical:false,due:'2 天后',late:false,
      change:'Switch DDR5 DRAM from Supplier A to Supplier B (same spec, pin-to-pin), covering 4 MTMs.',
      name:'M90q G6 DDR5 Dual-source Introduction',geo:'NA / EMEA',date:'2026-10-30',stage:'Review',progress:45,risk:'low'},
  t3:{type:'eval',tt:'EVAL',ttl:'认证范围扩展 · 专项评估',pcr:'SP-2026-11938',status:'Assessment',
      product:'ThinkSystem SR650 V3',func:'Certification',mandatory:false,critical:false,due:'3 天后',late:false,
      change:'Extend existing model certification to Brazil and India; assess ANATEL / BIS compliance and test lead time.',
      name:'SR650 V3 Certification Scope Extension (BR/IN)',geo:'LAS / IN',date:'2026-12-20',stage:'Assessment',progress:55,risk:'mid'},
  t4:{type:'otm',tt:'OTM',ttl:'OTM 评估汇总 · 待决策',pcr:'PCR-2026-08871',status:'Assessment',
      product:'ThinkPad X1 Carbon Gen 13',func:'OTM',mandatory:true,critical:true,due:'今日到期',late:true,
      change:'Consolidate Vote and Evaluation results from 5 functions, identify risks and open items, and choose the handling path.',
      name:'X1 Carbon G13 CPU Replacement · OTM Assessment',geo:'WW',date:'2026-11-15',stage:'Assessment',progress:60,risk:'high'},
  t5:{type:'rev',tt:'REVIEW',ttl:'Portfolio Review · 散热方案变更',pcr:'CP-2026-04455',status:'In Review',
      product:'Legion Pro 7i Gen10',func:'Portfolio',mandatory:false,critical:false,due:'明日到期',late:false,
      change:'Upgrade from dual-fan to triple-fan module to improve full-load thermal performance; Portfolio to confirm necessity and priority.',
      name:'Legion Pro 7i G10 Triple-fan Thermal Upgrade',geo:'WW',date:'2026-11-01',stage:'Review',progress:40,risk:'low'},
  t6:{type:'wi',tt:'WORK ITEM',ttl:'实施跟踪 · Work Item 状态复核',pcr:'PCR-2026-08830',status:'Implementation',
      product:'ThinkPad T14 Gen6',func:'Multi',mandatory:false,critical:false,due:'逾期 4 天',late:true,
      change:'Track execution and write-back of 3 released Work Items; identify overdue items and decide whether to escalate.',
      name:'T14 G6 Panel Dual-source · Implementation Work Items',geo:'WW',date:'2026-10-25',stage:'Implementation',progress:30,risk:'high'},
};
const ORDER=['t1','t2','t3','t4','t5','t6'];

/* similar PCR + evidence keyed loosely by task */
const SIM={
  t1:[{pcr:'PCR-2025-07612',n:'X1 Carbon G12 Ultra 155U→165U 换代',s:'94%',m:['同产品线','同变更动作','Closed']},
      {pcr:'PCR-2025-03340',n:'X1 Yoga G9 CPU 换代（同代 U 系列）',s:'88%',m:['相邻产品','CPU 换代','Closed']},
      {pcr:'CP-2024-09815',n:'T14s CPU 换代 BIOS 兼容问题',s:'81%',m:['BIOS 影响','有 Return 记录']}],
  t4:[{pcr:'PCR-2025-07612',n:'X1 Carbon G12 Ultra 换代（成本参考）',s:'94%',m:['成本 $0 增量','Closed']},
      {pcr:'CP-2024-09815',n:'T14s CPU 换代（含认证延期风险）',s:'81%',m:['认证 +3wk','风险案例']}],
};
const EVI={
  t1:[{t:'开发 Vote 输入标准（PCR Type: CPU 换代 × Development）已比对，Risk / Schedule 两项必答点缺失。',s:'规则库 · Vote 输入标准 v3'},
      {t:'相似 PCR-2025-07612 为同一换代动作，历史结论为 Agree、无硬件影响。',s:'Historical Case'},
      {t:'BIOS 兼容为该类变更高频关注点，来源 CP-2024-09815 的 Return Comment。',s:'历史 Comment'}],
  t4:[{t:'5 个 Mandatory 职能中 4 个已完成 Vote，Cost 尚未维护成本记录。',s:'PACE Task 状态'},
      {t:'认证职能提出 +3 周测试周期风险，可能影响 11/15 目标实施日。',s:'Evaluation Comment'},
      {t:'相似案例成本增量为 0，可作为 Work Item 目标日推算参考。',s:'Similar PCR 成本'}],
};

/* ---------- state ---------- */
let cur='t1', filter='all', taskQ='';
const state={}; // per task: {vote, path, done, chat, comment}
ORDER.forEach(id=>state[id]={vote:null,path:null,done:false,chat:[],comment:null});

const DEFAULT_COMMENT={
  vote:`开发侧确认：本次由 Ultra 155U 换代至 165U 为同封装、同供电 pin-to-pin 替代，主板无硬件改动。已核对参考机型 X1 Carbon G12（PCR-2025-07612）同类换代结论为无影响。

需补充：① BIOS microcode 版本与兼容性验证计划；② 换代后满载功耗与散热余量的验证数据。`,
  eval:`巴西（ANATEL）与印度（BIS）认证均需本地实验室送测。基于同平台历史记录，ANATEL 约 4–6 周、BIS 约 6–8 周，存在并行送测可能。

结论建议：可行，但目标实施日 2026-12-20 偏紧，建议将认证列为关键路径并预留缓冲。`,
  rev:`方向认可：三风扇方案对旗舰游戏本的满载散热与噪声有实质收益。建议明确：① 相对现方案的成本增量区间；② 是否影响整机厚度与重量指标。`,
  otm:'',
  wi:''
};

function shortTaskName(t){
  const raw=(t.name||t.ttl||'').replace(/^ThinkPad\s+/i,'').replace(/^ThinkCentre\s+/i,'').replace(/^ThinkSystem\s+/i,'');
  return raw.length>28?raw.slice(0,28)+'…':raw;
}
function shortTaskTitle(t){
  return `${t.tt} · ${shortTaskName(t)}`;
}
function commentText(t,s){
  if(s.comment!=null && s.comment!=='') return s.comment;
  return DEFAULT_COMMENT[t.type]||'';
}
function escTask(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}

function matchTaskQuery(id,q){
  if(!q) return true;
  const t=TASKS[id];
  const hay=[t.ttl,t.name,t.pcr,t.product,t.tt,t.type].join(' ').toLowerCase();
  return hay.includes(q);
}
function filteredTaskIds(){
  const q=taskQ.trim().toLowerCase();
  return ORDER.filter(id=>{
    if(filter!=='all' && TASKS[id].type!==filter) return false;
    return matchTaskQuery(id,q);
  });
}

/* ---------- render left ---------- */
function renderTaskList(){
  const host=document.getElementById('tasklist');
  const items=filteredTaskIds();
  const countEl=document.getElementById('taskCount');
  if(countEl) countEl.textContent=items.length;
  host.innerHTML=items.map(id=>{
    const t=TASKS[id],s=state[id];
    return `<div class="task ${id===cur?'active':''} ${s.done?'done':''}" data-id="${id}">
      <div class="task-top">
        <span class="ttype ${t.type}">${t.tt}</span>
        <span class="pcr mono">${t.pcr}</span>
        ${id===ORDER[0]?'<span class="tipdot" onclick="event.stopPropagation();showTip(event,\'badge\',22)">22</span>':''}
      </div>
      <h3>${t.ttl}</h3>
      <div class="task-meta">
        <span>${t.product}</span>
      </div>
      <div class="task-meta" style="margin-top:4px">
        ${t.critical?'<span class="flag">● Critical</span>':''}
        ${t.mandatory?'<span class="m">Mandatory</span>':''}
        <span class="due ${t.late?'late':''}">${s.done?'已完成':t.due}</span>
      </div>
    </div>`;
  }).join('') || `<div class="task-empty">无匹配任务</div>`;
  host.querySelectorAll('.task').forEach(el=>el.onclick=()=>{
    if(typeof reviewMode!=='undefined') reviewMode=null;
    cur=el.dataset.id;renderTaskAll();
  });
}

/* ---------- render center（对话形态） ---------- */
function renderCenter(){
  const t=TASKS[cur],s=state[cur];
  const isReview=typeof reviewMode!=='undefined' && reviewMode && s.done;
  document.getElementById('centerHead').innerHTML=`
    <div class="tb-t" title="${escTask(shortTaskTitle(t))}">
      <span class="tb-pin" title="已钉住">PCR Agent</span>
      ${isReview?'<span class="tb-review">回看 · 已完成</span>':''}
      <span class="ttype ${t.type}">${escTask(t.tt)}</span>
      <span class="tb-name">${escTask(shortTaskName(t))}</span>
    </div>
    ${isReview?`<button type="button" class="btn btn-ghost tb-back" id="ahReviewBack">← 返回</button>`:`
    <button type="button" class="tb-more" id="taskFlowBtn" title="流程操作">▾</button>
    <span class="tipdot" onclick="showTip(event,'flowVsSess',57)">57</span>
    <div class="task-flowmenu" id="taskFlowMenu">
      <button type="button" data-flow="pace">↗  在 PACE 中打开</button>
      <button type="button" data-flow="reassign">⇄  转派他人</button>
      <button type="button" data-flow="pending">⏸  标记 Pending</button>
      <button type="button" data-flow="full">▤  查看完整 PCR</button>
    </div>`}`;
  const cards={vote:voteCards,eval:evalCards,otm:otmCards,rev:revCards,wi:wiCards}[t.type](t,s);
  const lead={
    vote:`我已读取该 PCR 的变更详情与产品范围，并按 <b>${t.func} 的 Vote 输入标准</b>做了完整性检查。下方是我生成的 Comment 草稿——<span class="muted">你可以直接编辑，确认后才会写回 PACE。</span><span class="tipdot" onclick="showTip(event,'agent',23)">23</span>`,
    eval:`这是一个 <b>Evaluation Task</b>——以专项分析与证据为主。我整理了关键评估点与历史周期数据供你填写结论。`,
    otm:`5 个职能的评估已基本回收。我按 PCR Type 模板汇总了 Vote 分布、成本、风险与未决项——<b>处理路径由你决定</b>。`,
    rev:`我把这条 PCR 的变更详情、产品范围与附件做了摘要。<b>Approve / Return / Reject 由你决定</b>。`,
    wi:`这条 PCR 有 3 项已下发的 Work Item。我按 Target Date 与回写状态做了异常识别——<b>1 项已逾期</b>。`
  }[t.type];
  const alertHtml=(typeof approvalAlertHtml==='function' && !isReview)?approvalAlertHtml(t):'';
  const dock=isReview?`<div class="submit-dock"><div class="sd-done"><div class="ok">✓ 回看 · 已完成（只读，不可再提交）</div></div></div>`:taskDockHtml(t,s);
  const follow=(s.chat||[]).map(m=>{
    if(m.role==='user') return `<div class="bub me">${escTask(m.text)}</div>`;
    return `<div class="ai-lead task-follow"><div class="ai">AI</div><div class="txt">${m.html||escTask(m.text)}</div></div>`;
  }).join('');
  document.getElementById('centerBody').innerHTML=`
    <div class="task-thread" id="taskThread">
      <div class="task-ai">
        <div class="ai-lead"><div class="ai">AI</div><div class="txt">${lead}</div></div>
        ${alertHtml}
        ${cards}
        ${dock}
      </div>
      ${follow}
    </div>`;
  wireCenter();
  document.getElementById('ahReviewBack')?.addEventListener('click',()=>{
    if(typeof exitApprovalReview==='function') exitApprovalReview();
  });
  document.querySelectorAll('[data-ahgo]').forEach(b=>{
    b.onclick=()=>openApprovalHistoryTab(b.dataset.ahgo);
  });
  if(isReview){
    // disable edits
    document.querySelectorAll('#centerBody [contenteditable]').forEach(el=>{el.contentEditable='false';});
    document.querySelectorAll('#centerBody button[data-act],#centerBody .voteopt,#centerBody .path').forEach(el=>{el.disabled=true;});
  }
  bindTaskAskOnce();
  const body=document.getElementById('centerBody');
  if(body) body.scrollTop=0;
}

function taskDockHtml(t,s){
  const cfg={
    vote:{note:'AI 建议仅为草稿，确认后写回 PACE',primary:'确认并写回 Vote',ready:!!s.vote,force:true},
    eval:{note:'存在阻断性校验项，需补充 Evidence',primary:'提交评估结论',ready:false,force:true},
    otm:{note:'处理路径与 Work Item 需你确认后才在 PACE 生效',primary:'确认处理决策',ready:!!s.path,force:false},
    rev:{note:'最终审核动作由你决定',primary:'Approve',ready:true,force:false,extra:['Return','Reject']},
    wi:{note:'升级动作将通知 Assignee 及其负责人',primary:'升级逾期项',ready:true,force:false},
  }[t.type];
  if(s.done){
    return `<div class="submit-dock"><div class="sd-done"><div class="ok">✓ 已完成 · 只读回看（不可再编辑或提交）</div></div>
      <span class="tipdot" onclick="showTip(event,'sessDone',52)">52</span>
      <span class="tipdot" onclick="showTip(event,'taskActs',54)">54</span></div>`;
  }
  const extra=(cfg.extra||[]).map(x=>`<button class="btn btn-ghost" type="button" data-act="alt">${x}</button>`).join('');
  return `<div class="submit-dock">
    <div class="sd-note">${cfg.note}<span class="tipdot" onclick="showTip(event,'taskActs',54)">54</span></div>
    <div class="pact">
      <button class="btn btn-primary" type="button" data-act="primary" ${cfg.ready?'':'disabled'}>${cfg.primary}</button>
      ${extra}
      ${cfg.force?`<button class="btn-force" type="button" data-act="force">Force Submit</button><span class="tipdot" onclick="showTip(event,'force',27)">27</span>`:''}
      <span class="tipdot" onclick="showTip(event,'write',34)">34</span>
    </div>
  </div>`;
}

function voteCards(t,s){
  const cmt=commentText(t,s);
  return `
  <div class="block">
    <div class="block-h"><h4>Comment 草稿</h4><span class="tipdot" onclick="showTip(event,'draft',24)">24</span><span class="draft">AI 草稿 · 未提交</span>
      <div class="right"><button class="minibtn" data-act="regen" type="button">重新生成</button></div></div>
    <div class="block-b"><div class="comment edit" contenteditable="${s.done?'false':'true'}">${escTask(cmt).replace(/\n/g,'<br>')}</div></div>
  </div>
  <div class="block">
    <div class="block-h"><h4>你的 Vote 立场</h4><span class="tipdot" onclick="showTip(event,'vote',25)">25</span></div>
    <div class="block-b">
      <div class="votebar" data-votebar>
        <button class="voteopt ${s.vote==='agree'?'sel-agree':''}" data-vote="agree" type="button"><div class="vt">Agree</div><div class="vd">同意变更</div></button>
        <button class="voteopt ${s.vote==='dis'?'sel-dis':''}" data-vote="dis" type="button"><div class="vt">Disagree</div><div class="vd">存在阻碍</div></button>
        <button class="voteopt ${s.vote==='ni'?'sel-ni':''}" data-vote="ni" type="button"><div class="vt">No Impact</div><div class="vd">无影响</div></button>
      </div>
    </div>
  </div>
  <div class="block">
    <div class="block-h"><h4>提交前校验</h4><span class="tipdot" onclick="showTip(event,'valid',26)">26</span><span class="tag ${s.vote?'':'ni'}" style="margin-left:auto">${s.vote?'2 通过 · 1 警告':'待投票'}</span></div>
    <div class="block-b"><div class="valid">
      <div class="vrow ok"><span class="ic">${CHK}</span><span><span class="vl">产品范围完整</span><span class="vs">— 已覆盖全 GEO 主 MTM</span></span></div>
      <div class="vrow ok"><span class="ic">${CHK}</span><span><span class="vl">Comment 非空且含结论</span></span></div>
      <div class="vrow warn"><span class="ic">${WRN}</span><span><span class="vl">Schedule 影响未明确说明</span><span class="vs">— 建议补充 BIOS 验证周期；可 Force Submit</span></span></div>
    </div></div>
  </div>`;
}

function evalCards(t,s){
  const cmt=commentText(t,s);
  return `
  <div class="block">
    <div class="block-h"><h4>专项分析草稿</h4><span class="draft">AI 草稿</span></div>
    <div class="block-b"><div class="comment edit" contenteditable="${s.done?'false':'true'}">${escTask(cmt).replace(/\n/g,'<br>')}</div></div>
  </div>
  <div class="block">
    <div class="block-h"><h4>评估要点检查</h4></div>
    <div class="block-b"><div class="valid">
      <div class="vrow ok"><span class="ic">${CHK}</span><span><span class="vl">合规范围已明确</span><span class="vs">— ANATEL / BIS</span></span></div>
      <div class="vrow ok"><span class="ic">${CHK}</span><span><span class="vl">测试周期已量化</span></span></div>
      <div class="vrow err"><span class="ic">${ERR}</span><span><span class="vl">缺少 Evidence 附件</span><span class="vs">— 阻断性：需附历史送测记录</span></span></div>
    </div></div>
  </div>`;
}

function otmCards(t,s){return `
  <div class="block">
    <div class="block-h"><h4>职能评估汇总</h4><span class="tipdot" onclick="showTip(event,'otm',28)">28</span><span class="tag ni" style="margin-left:auto">Mandatory 4/5 完成</span></div>
    <div class="block-b" style="padding:0">
      <table class="sum"><thead><tr><th>职能</th><th>Vote</th><th>关键结论</th></tr></thead><tbody>
        <tr><td>Development / RD</td><td><span class="tag agree">Agree</span></td><td>pin-to-pin 换代，无硬件影响</td></tr>
        <tr><td>Quality</td><td><span class="tag agree">Agree</span></td><td>沿用现有可靠性矩阵</td></tr>
        <tr><td>Supply Chain</td><td><span class="tag ni">No Impact</span></td><td>供货无变化</td></tr>
        <tr><td>Certification</td><td><span class="tag dis">Disagree</span></td><td>认证 +3 周，威胁目标日</td></tr>
        <tr><td>Cost</td><td><span class="tag ni">— 待维护</span></td><td style="color:var(--warn)">成本记录尚未维护</td></tr>
      </tbody></table>
    </div>
  </div>
  <div class="block">
    <div class="block-h"><h4>风险与未决项</h4><span class="tag dis" style="margin-left:auto">2 项</span></div>
    <div class="block-b">
      <div class="risk"><span class="lv high">高</span><div class="rt"><b>认证周期威胁目标实施日</b> <span>— Certification 评估 +3 周</span></div></div>
      <div class="risk"><span class="lv mid">中</span><div class="rt"><b>Cost 成本记录未维护</b> <span>— Approve to Close 前需补齐</span></div></div>
    </div>
  </div>
  <div class="block">
    <div class="block-h"><h4>AI 推荐 Work Item 草稿</h4><span class="tipdot" onclick="showTip(event,'wi',30)">30</span><span class="draft">待 OTM 确认</span></div>
    <div class="block-b"><div class="wi">
      <b style="font-size:13px">补齐认证送测计划并锁定关键路径</b>
      <dl class="wi-grid">
        <dt>Function Team</dt><dd>Certification</dd>
        <dt>Owner</dt><dd>依职能配置 · 待确认</dd>
        <dt>Target Date</dt><dd>2026-10-20</dd>
        <dt>来源 Comment</dt><dd>Certification Evaluation</dd>
      </dl>
    </div></div>
  </div>
  <div class="block">
    <div class="block-h"><h4>选择处理路径</h4><span class="tipdot" onclick="showTip(event,'path',29)">29</span></div>
    <div class="block-b"><div class="paths" data-paths>
      <button class="path ${s.path==='awi'?'on':''}" data-path="awi" type="button"><div class="pt">Approve with Work Item</div><div class="pd">带工作项批准</div></button>
      <button class="path ${s.path==='close'?'on':''}" data-path="close" type="button"><div class="pt">Approve to Close</div><div class="pd">直接关闭</div></button>
      <button class="path ${s.path==='return'?'on':''}" data-path="return" type="button"><div class="pt">Return</div><div class="pd">退回补充材料</div></button>
      <button class="path ${s.path==='pending'?'on':''}" data-path="pending" type="button"><div class="pt">Pending</div><div class="pd">挂起等待</div></button>
    </div></div>
  </div>`;
}

function revCards(t,s){
  const cmt=commentText(t,s);
  return `
  <div class="block"><div class="block-h"><h4>PCR 摘要</h4></div>
    <div class="block-b"><div class="comment">Legion Pro 7i Gen10 拟将双风扇散热升级为三风扇方案，目标是提升 CPU+GPU 满载散热能力与降噪表现。</div></div>
  </div>
  <div class="block"><div class="block-h"><h4>Review Comment 草稿</h4><span class="draft">AI 草稿</span></div>
    <div class="block-b"><div class="comment edit" contenteditable="${s.done?'false':'true'}">${escTask(cmt).replace(/\n/g,'<br>')}</div></div>
  </div>`;
}

function wiCards(t,s){return `
  <div class="block"><div class="block-h"><h4>Work Item 执行状态</h4><span class="tag dis" style="margin-left:auto">1 逾期</span></div>
    <div class="block-b" style="padding:0">
      <table class="sum"><thead><tr><th>Work Item</th><th>系统</th><th>Owner</th><th>状态</th></tr></thead><tbody>
        <tr><td>面板二供 BOM 建立</td><td>PLM</td><td>L. Chen</td><td><span class="tag agree">已回写</span></td></tr>
        <tr><td>T1 认证信息更新</td><td>T1</td><td>M. Rao</td><td><span class="tag ni">进行中</span></td></tr>
        <tr><td>OD 采购计划调整</td><td>OD</td><td>K. Sato</td><td><span class="tag dis">逾期 4 天</span></td></tr>
      </tbody></table>
    </div>
  </div>`;
}

function wireCenter(){
  const s=state[cur];
  const flowBtn=document.getElementById('taskFlowBtn');
  const flowMenu=document.getElementById('taskFlowMenu');
  flowBtn?.addEventListener('click',e=>{
    e.stopPropagation();
    flowMenu?.classList.toggle('show');
  });
  flowMenu?.querySelectorAll('[data-flow]').forEach(b=>{
    b.onclick=()=>{flowMenu.classList.remove('show');toast(b.textContent.trim());};
  });
  document.getElementById('centerBody')?.querySelectorAll('[data-act=primary]').forEach(b=>b.onclick=()=>openWriteback());
  document.getElementById('centerBody')?.querySelectorAll('[data-act=force]').forEach(b=>b.onclick=()=>openForce());
  document.getElementById('centerBody')?.querySelectorAll('[data-act=alt]').forEach(b=>b.onclick=()=>openWriteback(b.textContent));

  const cmt=document.querySelector('#centerBody .comment.edit');
  if(cmt && !s.done){
    cmt.oninput=()=>{s.comment=cmt.innerText;};
  }
  if(s.done){
    document.querySelectorAll('#centerBody [data-votebar] .voteopt,#centerBody [data-paths] .path').forEach(el=>{
      el.style.pointerEvents='none';el.style.opacity='.72';
    });
    return;
  }
  document.querySelectorAll('#centerBody [data-votebar] .voteopt').forEach(b=>b.onclick=()=>{
    s.vote=b.dataset.vote;renderCenter();
  });
  document.querySelectorAll('#centerBody [data-paths] .path').forEach(b=>b.onclick=()=>{
    s.path=b.dataset.path;renderCenter();
  });
  document.querySelector('#centerBody [data-act=regen]')?.addEventListener('click',e=>{
    e.target.textContent='生成中…';setTimeout(()=>{e.target.textContent='重新生成';toast('已重新生成草稿');},700);
  });
}

function sendTaskAsk(){
  const inp=document.getElementById('taskAskin');
  const v=(inp?.value||'').trim();
  if(!v){inp?.focus();return;}
  const s=state[cur];
  if(s.done){toast('已完成任务为只读');return;}
  s.chat=s.chat||[];
  s.chat.push({role:'user',text:v});
  let reply='已记录你的补充。你可以继续完善 Comment，或选择 Vote 立场后写回。';
  let html=null;
  if(/Comment|严谨|改写|修改草稿/i.test(v)){
    s.comment=`开发侧确认：Ultra 155U→165U 为同封装 pin-to-pin 替代，主板无硬件改动。参考 X1 Carbon G12（PCR-2025-07612）结论为无影响。

补充说明：① BIOS microcode 兼容性验证计划（含回归范围）；② 满载功耗与散热余量的量化验证数据与窗口。结论：建议 Agree，并在 Comment 中保留上述两项跟踪项。`;
    reply='已把上方 Comment 草稿改得更严谨：补强了验证范围表述，并明确建议 Agree。';
    html=reply+`<span class="tipdot" onclick="showTip(event,'taskUpdate',55)">55</span>`;
  }else if(/Disagree|不同意/i.test(v)){
    reply='若投 Disagree：任务将回到提出方补充材料，OTM 可见你的 Comment 与阻碍点；不会直接写回 Agree。建议在 Comment 中写清阻断原因（如认证窗口）。';
  }else if(/Schedule|校验|补什么/i.test(v)){
    reply='Schedule 警告要求明确 BIOS / 认证验证周期对目标实施日的影响天数。可在 Comment 中补一句「预计 BIOS 验证 X 天，不冲击 11/15」或 Force Submit 并填写理由。';
  }else if(/G12|相似|案例|BIOS/i.test(v)){
    reply='参考 G12（PCR-2025-07612）是因为同产品线、同类 CPU 换代且已 Closed。右侧 Similar PCR 还有 T14s 案例（含 BIOS Return 记录），可一并对照。';
  }
  s.chat.push({role:'ai',text:reply,html:html||escTask(reply)});
  if(inp){inp.value='';if(window.AskComposer) AskComposer.autoGrow(inp);}
  hideTaskGuide();closeTaskPlus();
  renderCenter();
}

function showTaskGuide(){document.getElementById('taskGuide')?.classList.add('show');}
function hideTaskGuide(){document.getElementById('taskGuide')?.classList.remove('show');}
function closeTaskPlus(){
  document.getElementById('taskPlusmenu')?.classList.remove('show');
  document.getElementById('taskPlusbtn')?.classList.remove('on');
}
function bindTaskAskOnce(){
  if(window.__taskAskBound) return;
  window.__taskAskBound=1;
  const inp=document.getElementById('taskAskin');
  const box=document.getElementById('taskAskbox');
  const file=document.getElementById('taskfile');
  if(inp && window.AskComposer) AskComposer.bindTextarea(inp,{onSend:sendTaskAsk});
  document.getElementById('taskSend')?.addEventListener('click',sendTaskAsk);
  document.getElementById('taskPlusbtn')?.addEventListener('click',e=>{
    e.stopPropagation();
    const m=document.getElementById('taskPlusmenu');
    const on=!m.classList.contains('show');
    closeTaskPlus();hideTaskGuide();
    if(on){m.classList.add('show');document.getElementById('taskPlusbtn').classList.add('on');}
  });
  file?.addEventListener('change',()=>{if(file.files?.length) toast('已添加 '+file.files.length+' 个附件');});
  document.getElementById('taskPlusmenu')?.querySelectorAll('[data-tp]').forEach(b=>{
    b.onclick=()=>{
      closeTaskPlus();
      const k=b.dataset.tp;
      if(k==='file'){file?.click();return;}
      const map={comment:'把 Comment 改得更严谨一点',sim:'为什么参考 G12 那条？还有别的案例吗',valid:'Schedule 那条校验具体要补什么'};
      const inp2=document.getElementById('taskAskin');
      if(inp2){inp2.value=map[k]||'';inp2.focus();if(window.AskComposer) AskComposer.autoGrow(inp2);}
    };
  });
  document.getElementById('taskGuide')?.querySelectorAll('[data-tq]').forEach(b=>{
    b.onclick=()=>{
      const inp2=document.getElementById('taskAskin');
      if(inp2){inp2.value=b.dataset.tq;hideTaskGuide();sendTaskAsk();}
    };
  });
  inp?.addEventListener('focus',()=>{if(!state[cur].done) showTaskGuide();});
  inp?.addEventListener('blur',()=>setTimeout(hideTaskGuide,180));
  ;['dragenter','dragover'].forEach(ev=>box?.addEventListener(ev,e=>{e.preventDefault();box.classList.add('drop-on');}));
  ;['dragleave','drop'].forEach(ev=>box?.addEventListener(ev,e=>{e.preventDefault();box.classList.remove('drop-on');}));
  box?.addEventListener('drop',e=>{
    const fs=[...e.dataTransfer.files];if(!fs.length)return;
    toast('已添加 '+fs.length+' 个附件');
  });
  document.addEventListener('click',e=>{
    if(!e.target.closest('#taskPlusmenu')&&!e.target.closest('#taskPlusbtn')) closeTaskPlus();
    if(!e.target.closest('#taskFlowMenu')&&!e.target.closest('#taskFlowBtn'))
      document.getElementById('taskFlowMenu')?.classList.remove('show');
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') document.getElementById('taskFlowMenu')?.classList.remove('show');
  });
}

function renderActionBar(){ /* 动作已并入对话内容 */ }


/* ---------- right panel ---------- */
let ctxTab='detail';
const PCR_STAGES=['Create','Review','Screen','Assessment','Implementation','Benefit Tracking','Close'];
function pcrStageInfo(t){
  const stages=PCR_STAGES;
  let idx=stages.indexOf(t.stage);
  if(idx<0){
    if(t.status==='Implementation'||t.status==='In Progress') idx=4;
    else if(t.status==='Assessment') idx=3;
    else if(t.status==='In Review'||t.status==='Voting') idx=1;
    else idx=1;
  }
  const progress=t.progress!=null?t.progress:Math.round((idx/Math.max(stages.length-1,1))*100);
  const risk=t.risk||(t.late?'high':(t.critical?'mid':'low'));
  const riskLabel=risk==='high'?'High Risk':risk==='mid'?'Medium':'Low Risk';
  return {stages,idx,cur:stages[idx],progress,risk,riskLabel};
}
function renderProcessProgress(t){
  const info=pcrStageInfo(t);
  const fillPct=info.idx<=0?0:Math.round((info.idx/(info.stages.length-1))*100);
  const nodes=info.stages.map((name,i)=>{
    const cls=i<info.idx?'done':(i===info.idx?'cur':'');
    const bang=(i===info.idx && info.risk==='high')?'<span class="pp-bang">!</span>':'';
    const mark=i<info.idx?'✓':'';
    return `<div class="pp-node ${cls}"><span class="pp-dot">${mark}${bang}</span><span class="pp-lab">${name}</span></div>`;
  }).join('');
  return `<div class="pp">
    <div class="pp-track">
      <div class="pp-line"></div>
      <div class="pp-line-fill" style="width:calc(${fillPct}% - 10px)"></div>
      ${nodes}
    </div>
    <div class="pp-mon">
      <h5>${info.cur} Monitoring</h5>
      <div class="pp-grid">
        <div><div class="k">Current Stage</div><div class="v">${info.cur}</div></div>
        <div><div class="k">Execution Progress</div><div class="v">${info.progress}%</div></div>
        <div><div class="k">Risk Level</div><div class="v"><span class="pp-risk ${info.risk}">⚠ ${info.riskLabel}</span></div></div>
        <div><div class="k">Target Completion Date</div><div class="v">${t.date}</div></div>
      </div>
      <div class="pp-barwrap"><div class="pp-bar"><i style="width:${info.progress}%"></i></div><span class="pp-pct">${info.progress}%</span></div>
    </div>
  </div>`;
}
function renderCtx(){
  const t=TASKS[cur];
  const body=document.getElementById('ctxBody');
  const dlSvg=`<svg class="i" style="width:14px;height:14px"><path d="M8 2v8M5 7.5L8 10.5l3-3M3 13h10"/></svg>`;
  if(ctxTab==='detail'){
    body.innerHTML=`
      <div class="sec" data-sec>
        <div class="sec-h"><span class="caret">▾</span>Basic Information</div>
        <div class="sec-c"><dl class="fields">
          <dt>PCR#</dt><dd class="mono">${t.pcr}</dd>
          <dt>Name</dt><dd>${t.name}</dd>
          <dt>Product</dt><dd>${t.product}</dd>
          <dt>GEO</dt><dd>${t.geo}</dd>
          <dt>Function</dt><dd>${t.func}</dd>
          <dt>Target Completion Date</dt><dd>${t.date}</dd>
          <dt>Status</dt><dd>${t.status}</dd>
        </dl></div>
      </div>
      <div class="sec" data-sec>
        <div class="sec-h"><span class="caret">▾</span>Process Progress &amp; Monitoring</div>
        <div class="sec-c">${renderProcessProgress(t)}</div>
      </div>
      <div class="sec" data-sec>
        <div class="sec-h"><span class="caret">▾</span>Change Request in Detail</div>
        <div class="sec-c"><div style="font-size:12.5px;line-height:1.6;color:var(--ink)">${t.change}</div></div>
      </div>
      <div class="sec" data-sec>
        <div class="sec-h"><span class="caret">▾</span>Attachments &amp; Reference</div>
        <div class="sec-c">
          <div class="attach"><span class="fx">PDF</span><div><div>Change Technical Manual.pdf</div><div class="fmeta">1.2 MB · v2</div></div><span class="fdl">${dlSvg}</span></div>
          <div class="attach"><span class="fx xls">XLS</span><div><div>Impacted MTM List.xlsx</div><div class="fmeta">86 KB</div></div><span class="fdl">${dlSvg}</span></div>
        </div>
      </div>`;
  } else if(ctxTab==='similar'){
    const sims=SIM[cur]||SIM.t1;
    body.innerHTML=`<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">Similarity by product, change action, and function domain · for reference only; judge comparability yourself</div>`+
      sims.map(x=>`<div class="simcard">
        <div class="simcard-top"><span class="mono" style="font-size:11.5px;color:var(--ink-2)">${x.pcr}</span><span class="sim%">${x.s}</span></div>
        <h5>${x.n}</h5>
        <div class="sm">${x.m.map(m=>`<span>· ${m}</span>`).join('')}</div>
      </div>`).join('');
  } else if(ctxTab==='approval'){
    body.innerHTML=typeof renderApprovalHistoryHtml==='function'
      ? renderApprovalHistoryHtml(t)
      : '<div class="ah-empty">Approval History 未加载</div>';
    if(typeof wireApprovalHistory==='function') wireApprovalHistory();
  } else {
    const ev=EVI[cur]||EVI.t1;
    body.innerHTML=`<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">Evidence sources behind each AI suggestion; click to trace original records</div>`+
      ev.map((e,i)=>`<div class="evi"><span class="en">${i+1}</span><div class="ec"><div>${e.t}</div><span class="src">${e.s}</span></div></div>`).join('');
  }
  body.querySelectorAll('[data-sec] .sec-h').forEach(h=>h.onclick=()=>h.parentElement.classList.toggle('collapsed'));
}
document.querySelectorAll('.ctx-tab').forEach(b=>b.onclick=()=>{
  ctxTab=b.dataset.t;
  document.querySelectorAll('.ctx-tab').forEach(x=>x.classList.toggle('on',x===b));
  renderCtx();
});

/* ---------- modals ---------- */
const scrim=document.getElementById('scrim'),modalHost=document.getElementById('modalHost');
function closeModal(){
  if(scrim)scrim.classList.remove('show');
  PARSE.fillEditing=false;
  if(PARSE._fillEsc){document.removeEventListener('keydown',PARSE._fillEsc);PARSE._fillEsc=null;}
}
if(scrim)scrim.onclick=e=>{if(e.target===scrim)closeModal();};

function openWriteback(alt){
  const t=TASKS[cur],s=state[cur];
  const voteLabel={agree:'Agree',dis:'Disagree',ni:'No Impact'}[s.vote];
  const pathLabel={awi:'Approve with Work Item',close:'Approve to Close',return:'Return',pending:'Pending'}[s.path];
  let rows='';
  if(t.type==='vote')rows=`<div class="wl"><span class="k">Vote 结果</span><span class="v">${voteLabel}</span></div>
    <div class="wl"><span class="k">Comment</span><span class="v">已编辑（含结论）</span></div>`;
  else if(t.type==='otm')rows=`<div class="wl"><span class="k">处理路径</span><span class="v">${pathLabel}</span></div>
    <div class="wl"><span class="k">Work Item</span><span class="v">1 项草稿一并创建</span></div>`;
  else if(t.type==='rev')rows=`<div class="wl"><span class="k">审核动作</span><span class="v">${alt||'Approve'}</span></div>`;
  else if(t.type==='wi')rows=`<div class="wl"><span class="k">动作</span><span class="v">升级 1 项逾期 Work Item</span></div>`;
  else rows=`<div class="wl"><span class="k">动作</span><span class="v">提交评估结论</span></div>`;
  modalHost.innerHTML=`<div class="modal">
    <div class="modal-h"><h3>确认写回 PACE</h3><p>${t.pcr} · ${t.tt} Task</p></div>
    <div class="modal-b">
      <div class="writeback">${rows}
        <div class="wl"><span class="k">目标系统</span><span class="v mono">PACE</span></div>
        <div class="wl"><span class="k">操作人</span><span class="v">Jordan (JC)</span></div>
      </div>
      <div class="modal-note"><svg class="i" style="width:13px;height:13px;flex:none"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z"/><path d="M8 5v4M8 11h.01"/></svg>写回后将留痕；如需撤回请在 PACE 中操作。</div>
    </div>
    <div class="modal-f"><button class="btn btn-ghost" data-x>取消</button><button class="btn btn-primary" data-ok>确认写回</button></div>
  </div>`;
  scrim.classList.add('show');
  modalHost.querySelector('[data-x]').onclick=closeModal;
  modalHost.querySelector('[data-ok]').onclick=()=>{closeModal();s.done=true;renderTaskAll();toast('已写回 PACE · 任务完成');};
}

function openForce(){
  const t=TASKS[cur];
  modalHost.innerHTML=`<div class="modal">
    <div class="modal-h"><h3>Force Submit（受控例外）</h3><p>存在警告项时的强制提交，将完整留痕并对 OTM 可见</p></div>
    <div class="modal-b">
      <div class="writeback" style="border-color:var(--warn-bg);background:var(--warn-bg)">
        <div class="wl"><span class="k">被绕过的校验</span><span class="v" style="color:var(--warn)">Schedule 影响未说明</span></div>
      </div>
      <div style="font-size:12px;color:var(--ink-2);margin-top:10px">强制提交理由（必填）</div>
      <textarea class="reason" placeholder="例如：BIOS 验证周期将在下一版本补充，不影响本轮换代结论…"></textarea>
    </div>
    <div class="modal-f"><button class="btn btn-ghost" data-x>取消</button><button class="btn btn-warnghost" data-ok>强制提交</button></div>
  </div>`;
  scrim.classList.add('show');
  const ta=modalHost.querySelector('.reason');
  modalHost.querySelector('[data-x]').onclick=closeModal;
  modalHost.querySelector('[data-ok]').onclick=()=>{
    if(!ta.value.trim()){ta.style.borderColor='var(--disagree)';ta.focus();return;}
    closeModal();state[cur].done=true;renderTaskAll();toast('已 Force Submit · 理由已留痕');
  };
}

/* ---------- toast ---------- */
function toast(msg){
  const el=document.getElementById('toast');
  const slot=document.getElementById('tmsg')||document.getElementById('toastMsg');
  if(slot)slot.textContent=msg;
  if(!el)return;
  el.classList.add('show');clearTimeout(tm);tm=setTimeout(()=>el.classList.remove('show'),2600);
}

/* ---------- filters ---------- */
(function bindTaskFilters(){
  const host=document.getElementById('filters');
  if(!host) return;
  host.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    filter=c.dataset.f;
    host.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c));
    const items=filteredTaskIds();
    if(items.length&&!items.includes(cur)){cur=items[0];}
    renderTaskAll();
  });
})();
(function bindTaskSearch(){
  const inp=document.getElementById('taskq');
  if(!inp) return;
  inp.addEventListener('input',()=>{
    taskQ=inp.value||'';
    const items=filteredTaskIds();
    if(items.length&&!items.includes(cur)){cur=items[0];}
    renderTaskList();
  });
})();

/* ---------- render all ---------- */
function renderTaskAll(){
  renderTaskList();renderCenter();renderCtx();
  if(typeof paintDots==='function')paintDots();
  if(window.Sessions && typeof TASKS!=='undefined' && cur && TASKS[cur]){
    Sessions.syncTask(cur, TASKS[cur]);
  }
}

/* MyTasks namespace for parallel ownership */
window.MyTasks = {
  ensureInit() {
    if (!window.__taskInit) {
      window.__taskInit = 1;
      renderTaskAll();
    }
  },
  selectTask(id) {
    if (!id || !TASKS[id]) return;
    cur = id;
    renderTaskAll();
  },
  renderAll: typeof renderTaskAll === 'function' ? renderTaskAll : function () {}
};
window.renderTaskAll = renderTaskAll;
window.sendTaskAsk = sendTaskAsk;
window.state = state;
