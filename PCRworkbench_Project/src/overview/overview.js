/* overview: home dashboard + create PCR */
/* ══════════ 创建 PCR ══════════ */
const DEMO_MAIL=`Hi team, Per confirmed by intel, there will be a X9 12Xe non-vPro
Processor in Nova Lake scope, with better cost and same performance.
Please help to change the orginal MS5 X9 12Xe vPro to this T6 non-vPro
SKU on CPU list, no increase to total number of PCBA or NRE, thanks.`;
const RULE_FOOT='⚠ 原型阶段规则示例，实际规则待业务确认';
const TYPE_RULE_FOOT='⚠ 原型阶段规则示例，实际类型判定规则待业务确认';
const PCR_TYPES=['Hardware/SBB','Software','Cost Reduction','Certification','Process','Other'];
const STEP_RULES={
  s1:{lead:'正在按「变更内容识别」规则核对：',items:[
    '识别 PCR Type（Hardware/SBB、Software、Cost Reduction 等）——仅推荐，须用户确认',
    '识别变更对象与动作（替换 / 新增 / 移除 / 升级）',
    '判定 CP（root+branch）或 SP（单条）；置信度不足时不自动填写'
  ]},
  s2:{lead:'正在按「影响产品识别」规则核对：',items:[
    '产品名须匹配主数据；匹配不上则提示',
    '原文未提区域时不默认填 WW，标为缺失并追问',
    '同一变更跨多个产品线时，提示是否拆分'
  ]},
  s3:{lead:'正在按当前 PCR Type 的必填规则核对：',items:[
    '必须项：Impacted Products、Business Case、目标实施日、Geo、变更前后描述',
    '建议项不阻断提交；字段间一致性（如成本叙事 vs Business Case）要提示'
  ]},
  ssim:{lead:'正在按「相似 / 重复 PCR」规则检索：',items:[
    '重复性检查：相同产品 + 相同变更对象 + 状态非 Closed → 硬阻断',
    '相似案例：综合产品、Type、变更对象、动作、功能域计算相似度',
    '展示历史 Comment / Cost / Assessment 与 Return 教训，由用户判断可比性'
  ]},
  s4:{lead:'正在按「可行性与价值」三维规则评估：',items:[
    '技术：引用相似 PCR 检查结论、硬件/认证/兼容影响',
    '时间：目标实施日 vs 同类历史周期',
    '价值：成本方向、业务驱动力；AI 给建议，人做决定'
  ]},
  s5:{lead:'正在按「提交验证」规则把关：',items:[
    'Type 合理性、必填完整性、字段逻辑一致性、拆分建议确认',
    '硬性合规项不可 Force Submit 绕过',
    '提交目标明示：写入 PACE，进入 Review'
  ]}
};

function ruleBanner(key){
  const r=STEP_RULES[key]||STEP_RULES.s1;
  let lead=r.lead;
  if(key==='s3'&&PARSE.pcrType) lead=`正在按 ${PARSE.pcrType} 的必填规则核对：`;
  return `<div class="prule"><div class="prule-t">${lead}</div><ul>${r.items.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
}
function stepBody(key,checks,extra=''){
  return ruleBanner(key)+checks+(extra||'')+`<div class="rule-note">${RULE_FOOT}</div>`;
}
const PARSE={
  active:false,createIntent:false,text:'',files:[],skipped:false,animating:false,
  timers:[],steps:[],homeOpen:false,split:false,forceReason:'',suspended:false,
  fields:null,issues:{},splitDecision:null,issueOpen:{},thinkOpen:false,issueExpandAll:false,
  typeConfirmed:false,pcrType:null,typePick:null,preselectedType:null,
  typeMap:null,typeMapOpen:false,typeMeta:null,
  simConfirmed:false,simDup:null,simDupHandled:false,simCases:[],
  simRefOpen:{},simCompareOpen:false,simCompareId:null,
  submitted:false,pcrNumber:null,submitAt:null,histMark:null,
  fillEditing:false,fillSnapshot:null,withdrawLog:null
};
const PH_ASK='问点什么，或让我分析某个产品、项目…';
const PH_CREATE='描述你的变更需求，或粘贴邮件、会议纪要…';
const PH_MORE='补充信息…';

function extractFields(text){
  const t=text||'';
  const products=[];
  if(/T14p/i.test(t)) products.push('ThinkPad T14p Gen 5');
  if(/X1\s*(Carbon|G13)/i.test(t)) products.push('ThinkPad X1');
  if(/M90q/i.test(t)) products.push('ThinkCentre M90q');
  if(!products.length && /X9\s*12Xe/i.test(t) && /vPro/i.test(t)) products.push('ThinkPad T14p Gen 5');
  const sku=(t.match(/X9\s*12Xe(?:\s*(?:non-)?vPro)?/i)||t.match(/Ultra\s*[0-9]+\s*\d*U/i)||[''])[0].trim();
  let action='变更';
  if(/replac|change|换/i.test(t)) action='替换';
  if(/upgrade|升级/i.test(t)) action='升级';
  if(/\badd\b|新增/i.test(t)) action='新增';
  let geo=null;
  if(/\bPRC\b|China|中国/i.test(t)) geo='PRC';
  else if(/\bWW\b|worldwide|全球/i.test(t)) geo='WW';
  else if(/Brazil/i.test(t)) geo='Brazil';
  const looksMail=/Hi team|Per confirmed|Subject:|Best regards|thanks\./i.test(t);
  return {products,sku,action,geo,pcrType:'Hardware/SBB',looksMail,long:t.length>80,costTalk:/better cost|cost saving|NRE|PCBA/i.test(t)};
}

function initParseFields(ex){
  PARSE.fields={
    products:{group:'must',k:'ok',t:'Impacted Products',d:ex.products[0]||'已匹配'},
    change:{group:'must',k:'ok',t:'Change Request 完整性',d:'已说明变更前后'},
    bc:{group:'must',k:'warn',t:'Business Case Reason',d:'填了 Marketing Request，但原文强调成本优势',val:'Marketing Request'},
    geo:{group:'must',k:'err',t:'Geo Impact',d:ex.geo||'原文未提及区域',val:ex.geo||null},
    target:{group:'must',k:'err',t:'Target Implementation',d:'与创建日相同（2025-08-25），通常不合理',val:'2025-08-25'},
    cp:{group:'sug',k:'ok',t:'CP Team',d:ex.products[0]||'—'},
    nre:{group:'sug',k:'info',t:'NRE / Profit Impact',d:'原文可量化，建议写入',val:null},
    evidence:{group:'sug',k:'wait',t:'Evidence 附件',d:'未提供'}
  };
  PARSE.issues={bc:false,geo:false,target:false,nre:false};
  PARSE.splitDecision=null;
}

function fieldGroups(){
  const f=PARSE.fields||{};
  const must=Object.values(f).filter(x=>x.group==='must');
  const sug=Object.values(f).filter(x=>x.group==='sug');
  const mustDone=must.filter(x=>x.k==='ok').length;
  const sugDone=sug.filter(x=>x.k==='ok').length;
  return {must,sug,mustDone,sugDone,mustTotal:must.length,sugTotal:sug.length};
}

function missingMustLabels(){
  const map={bc:'Business Case',geo:'Geo',target:'目标日'};
  return Object.keys(map).filter(k=>PARSE.fields&&PARSE.fields[k]&&PARSE.fields[k].k!=='ok').map(k=>map[k]);
}

function mustAllOk(){const g=fieldGroups();return g.mustDone===g.mustTotal;}

function typeCandidates(ex){
  return [
    {id:'Hardware/SBB',conf:'hi',confLabel:'高',basis:'变更对象为 CPU SKU，动作为替换，涉及 CPU List 维护'},
    {id:'Cost Reduction',conf:'mid',confLabel:'中',basis:'原文强调 "better cost"，可能属于成本优化类变更'}
  ];
}
function effectiveType(){return PARSE.typeConfirmed&&PARSE.pcrType?PARSE.pcrType:(PARSE.typePick||'Hardware/SBB');}
function applyTypeMeta(type){
  const t=type||effectiveType();
  PARSE.typeMeta={
    type:t,
    similar:t==='Cost Reduction'?5:t==='Software'?2:3,
    leadDays:t==='Cost Reduction'?12:t==='Certification'?28:18,
    similarHint:t==='Cost Reduction'?'同类成本优化案例':'同类硬件/SKU 变更'
  };
}
function buildSimCases(type){
  const base=[
    {id:'SP20250612_0031',name:'Change U7 155H to U7 165H on T14p Gen 5',status:'Closed',days:47,pct:91,
      like:'同产品线、同为 CPU SKU 替换、同为 Intel 平台',
      returned:{n:1,reason:'未说明是否影响已认证机型',advice:'建议本次提前补充认证影响说明'},
      refs:{comment:'LM 要求补充认证矩阵后二次 Review 通过；关键评论强调「non-vPro 切分需写清已认证机型范围」。',
        cost:'NRE 无增加；PCBA 数量不变；无额外 tooling 成本。',
        assess:'技术可行；认证风险中等；建议与认证职能并行评审。'}},
    {id:'CP20250408_0117',name:'vPro to non-vPro SKU change on ThinkPad L14',status:'Closed',days:38,pct:84,
      like:'同为 vPro→non-vPro 变更',
      costNote:'成本参考：NRE 无增加，PCBA 数量不变（与本次一致）',
      refs:{comment:'Portfolio 认可成本叙事与 SKU 对齐。',cost:'NRE 0；PCBA 持平；与本次描述一致。'}},
    {id:'SP20241120_0208',name:'CPU List update on T14p Gen 4',status:'Closed',days:22,pct:72,
      like:'同为 CPU List 维护类变更',
      refs:{comment:'作为附属维护单独立项时周期更短；若与 SKU 替换合并需在描述中说明边界。'}}
  ];
  if(type==='Software') return base.slice(0,2);
  if(type==='Cost Reduction'){
    return base.concat([
      {id:'SP20250301_0099',name:'Better cost CPU swap on E14 Gen 6',status:'Closed',days:31,pct:68,
        like:'同为成本导向 CPU 替换',refs:{cost:'Savings 写入 Business Case，OTM 按季度跟踪。'}},
      {id:'CP20250115_0042',name:'Cost down memory config on M90q',status:'Closed',days:19,pct:61,
        like:'成本优化类变更、有 NRE/PCBA 表述',refs:{comment:'Cost Reduction 模板字段更完整时审批更快。',cost:'明确年度节省金额后一次通过。'}}
    ]);
  }
  return base;
}
function initSimData(keepDupFlag){
  const t=PARSE.pcrType||PARSE.typePick||'Hardware/SBB';
  PARSE.simCases=buildSimCases(t);
  PARSE.simConfirmed=false;
  PARSE.simDupHandled=false;
  PARSE.simRefOpen={};
  PARSE.simCompareOpen=false;
  PARSE.simCompareId=null;
  if(!keepDupFlag) PARSE.simDup=null;
}
function simStepBody(){
  const cases=PARSE.simCases||[];
  const n=cases.length;
  const tipDots=`<span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrSimDupVsSim',47)">47</span>
    <span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrSimReturn',48)">48</span>
    <span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrSimClosed',49)">49</span>`;
  let dupHtml='';
  if(PARSE.simDup && !PARSE.simDupHandled){
    const d=PARSE.simDup;
    dupHtml=`<div class="sim-dup block">
      <div class="sd-t">✗ 发现 ${d.count||1} 条完全重复的在途 PCR</div>
      <div class="sd-sub"><b>${d.id}</b>　·　状态：${d.status}</div>
      <div class="sd-sub">${d.same||'相同产品、相同变更对象、相同变更动作'}</div>
      <div class="sd-hard">⚠ 硬阻断：不可重复提交，请先确认是否为同一需求</div>
      <div class="sim-acts">
        <button class="btn btn-ghost" type="button" onclick="event.stopPropagation();viewDupPcr()">查看该 PCR</button>
        <button class="btn btn-primary" type="button" onclick="event.stopPropagation();explainSimDiff()">说明差异并继续</button>
      </div>
    </div>`;
  } else {
    dupHtml=`<div class="sim-dup">
      <div class="sd-t">✓ 未发现完全重复的在途 PCR</div>
      <div class="sd-sub">检索范围：相同产品 + 相同变更对象 + 状态非 Closed</div>
      ${PARSE.simDupHandled?`<div class="sd-sub" style="margin-top:6px;color:var(--ink-3)">已说明与 ${PARSE.simDup&&PARSE.simDup.id||'在途 PCR'} 的差异，允许继续</div>`:''}
    </div>`;
  }
  const cards=cases.map(c=>{
    const openKey=PARSE.simRefOpen[c.id];
    const ret=c.returned?`<div class="sim-ret">⚠ 该 PCR 曾被 Return ${c.returned.n} 次<br>退回原因：${c.returned.reason}<br>→ ${c.returned.advice}</div>`:'';
    const costNote=c.costNote?`<div class="sc-like">${c.costNote}</div>`:'';
    const btns=[];
    if(c.refs&&c.refs.comment) btns.push(`<button class="btn btn-ghost" type="button" style="padding:2px 8px;font-size:12px" onclick="event.stopPropagation();toggleSimRef('${c.id}','comment')">Comment 参考</button>`);
    if(c.refs&&c.refs.cost) btns.push(`<button class="btn btn-ghost" type="button" style="padding:2px 8px;font-size:12px" onclick="event.stopPropagation();toggleSimRef('${c.id}','cost')">Cost 参考</button>`);
    if(c.refs&&c.refs.assess) btns.push(`<button class="btn btn-ghost" type="button" style="padding:2px 8px;font-size:12px" onclick="event.stopPropagation();toggleSimRef('${c.id}','assess')">Assessment</button>`);
    const refBody=openKey&&c.refs&&c.refs[openKey]?`<div class="sim-ref-body"><b>${openKey==='comment'?'Comment':openKey==='cost'?'Cost':'Assessment'} 参考</b><br>${c.refs[openKey]}</div>`:'';
    return `<div class="sim-card">
      <div class="sc-top"><span class="sc-id">● ${c.id}</span><span class="sc-pct">相似度 ${c.pct}%</span></div>
      <div class="sc-name">${c.name}</div>
      <div class="sc-meta">状态：${c.status}　·　周期：${c.days} 天</div>
      <div class="sc-like">相似点：${c.like}</div>
      ${costNote}${ret}
      <div class="sim-refs"><span class="sr-lab">可参考内容：</span>${btns.join(' ')}</div>
      ${refBody}
    </div>`;
  }).join('');
  let cmp='';
  if(PARSE.simCompareOpen){
    const sel=cases.find(x=>x.id===PARSE.simCompareId)||cases[0];
    if(sel){
      cmp=`<div class="sim-cmp"><table>
        <tr><th>字段</th><th>本次 PCR</th><th>${sel.id}</th></tr>
        <tr><td>产品</td><td class="same">ThinkPad T14p Gen 5</td><td class="same">${/T14p/.test(sel.name)?'ThinkPad T14p Gen 5':'ThinkPad L14 / 其他'}</td></tr>
        <tr><td>PCR Type</td><td class="same">${PARSE.pcrType||PARSE.typePick||'Hardware/SBB'}</td><td class="same">Hardware/SBB</td></tr>
        <tr><td>变更对象</td><td class="same">CPU SKU</td><td class="same">CPU SKU</td></tr>
        <tr><td>变更动作</td><td class="same">替换</td><td class="diff">${/List/.test(sel.name)?'清单维护':'替换'}</td></tr>
        <tr><td>周期参考</td><td class="diff">待定</td><td class="same">${sel.days} 天（Closed）</td></tr>
      </table></div>`;
    }
  }
  const blocked=PARSE.simDup&&!PARSE.simDupHandled;
  return ruleBanner('ssim')+`<div class="sim-box">
    <div class="sim-sec">
      <div class="sim-sec-h">重复性检查 ${tipDots}</div>
      ${dupHtml}
    </div>
    <div class="sim-sec">
      <div class="sim-sec-h">相似案例参考</div>
      ${cards||'<div class="sd-sub">暂无相似案例</div>'}
    </div>
    <div class="sim-note">⚠ 相似度综合产品、PCR Type、变更对象、变更动作、功能域计算。<br>Closed 不等于方案成功，请自行判断可比性。</div>
    <div class="sim-acts">
      <button class="btn btn-ghost" type="button" onclick="event.stopPropagation();toggleSimCompare()">查看完整对比</button>
      <button class="btn btn-primary" type="button" ${blocked?'disabled style="opacity:.5"':''} onclick="event.stopPropagation();confirmSimRef()">确认已参考</button>
    </div>
    ${cmp}
  </div><div class="rule-note">${RULE_FOOT}</div>`;
}
function toggleSimRef(id,kind){
  const cur=PARSE.simRefOpen[id];
  PARSE.simRefOpen[id]=cur===kind?null:kind;
  const sm=stepBy('sim');if(sm){sm.body=simStepBody();sm.open=true;}
  renderPlist();
}
function toggleSimCompare(){
  PARSE.simCompareOpen=!PARSE.simCompareOpen;
  if(PARSE.simCompareOpen) PARSE.simCompareId=(PARSE.simCases[0]&&PARSE.simCases[0].id)||null;
  const sm=stepBy('sim');if(sm){sm.body=simStepBody();sm.open=true;}
  renderPlist();
}
function confirmSimRef(){
  if(PARSE.simDup&&!PARSE.simDupHandled){toast('存在完全重复的在途 PCR，请先处理硬阻断');return;}
  PARSE.simConfirmed=true;
  const n=(PARSE.simCases||[]).length;
  const sm=stepBy('sim');
  if(sm){sm.st='done';sm.sum='已参考 '+n+' 条相似案例';sm.open=true;sm.body=simStepBody();}
  syncStepStates();
  fillAllStepBodies(extractFields(PARSE.text));
  if(sm) sm.open=true;
  renderPlist();
  toast('已确认参考 '+n+' 条相似案例');
}
function viewDupPcr(){
  const d=PARSE.simDup;if(!d)return;
  toast('原型：打开 '+d.id+' 详情（演示）');
}
function explainSimDiff(){
  modalHost.innerHTML=`<div class="modal"><div class="modal-h"><h3>说明与在途 PCR 的差异</h3><p>硬阻断解除前须说明为何不是同一需求</p></div>
    <div class="modal-b"><textarea class="reason" id="simDiffReason" placeholder="例如：变更对象不同 / 目标区域不同 / 业务驱动力不同…"></textarea></div>
    <div class="modal-f"><button class="btn btn-ghost" data-x>取消</button><button class="btn btn-primary" data-ok>确认并继续</button></div></div>`;
  scrim.classList.add('show');
  modalHost.querySelector('[data-x]').onclick=closeModal;
  modalHost.querySelector('[data-ok]').onclick=()=>{
    const r=(document.getElementById('simDiffReason').value||'').trim();
    if(!r){toast('请填写差异说明');return;}
    PARSE.simDupHandled=true;PARSE.simDiffReason=r;closeModal();
    const sm=stepBy('sim');if(sm){sm.st='pending';sm.sum='找到 '+(PARSE.simCases||[]).length+' 条参考';sm.body=simStepBody();sm.open=true;}
    renderPlist();toast('已说明差异，可继续确认参考');
  };
}
function setSimDuplicate(on){
  if(on){
    PARSE.simDup={id:'SP20260812_0044',status:'Under Review',count:1,same:'相同产品、相同变更对象、相同变更动作'};
    PARSE.simDupHandled=false;PARSE.simConfirmed=false;
  } else {
    PARSE.simDup=null;PARSE.simDupHandled=false;
  }
  const sm=stepBy('sim');
  if(sm){sm.body=simStepBody();syncSimStepState(sm);sm.open=true;}
  renderPlist();
}
function syncSimStepState(sm){
  if(!sm) sm=stepBy('sim');if(!sm)return;
  const n=(PARSE.simCases||[]).length;
  if(PARSE.simDup&&!PARSE.simDupHandled){sm.st='err';sm.sum='发现完全重复';}
  else if(PARSE.simConfirmed){sm.st='done';sm.sum='已参考 '+n+' 条相似案例';}
  else{sm.st='pending';sm.sum=n?('找到 '+n+' 条参考'):'待确认';}
}

function typeMapFor(type){
  if(type==='Cost Reduction'){
    return {
      keep:4,drop:3,
      keepList:['Impacted Products','Change Request','Geo Impact','Business Case Reason'],
      dropList:['CPU List 关联','认证影响矩阵','SBB 结构字段']
    };
  }
  return {
    keep:5,drop:2,
    keepList:['Impacted Products','Change Request','Geo Impact','Business Case Reason','NRE / Profit Impact'],
    dropList:['成本节省金额','ROI 测算字段']
  };
}
function typeStepBody(){
  const ex=extractFields(PARSE.text);
  const cands=typeCandidates(ex);
  const pick=PARSE.typePick||cands[0].id;
  const pre=PARSE.preselectedType||'（未预选）';
  const tipDots=`<span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrTypeConfirm',44)">44</span>
    <span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrTypeCandidates',45)">45</span>
    <span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrTypeRerun',46)">46</span>`;
  if(PARSE.typeConfirmed&&PARSE.pcrType){
    const map=PARSE.typeMap||typeMapFor(PARSE.pcrType);
    const detail=PARSE.typeMapOpen?`<div class="type-map">
      <b>字段映射详情</b>
      <ul>${(map.keepList||[]).map(x=>`<li>✓ 保留：${x}</li>`).join('')}
      ${(map.dropList||[]).map(x=>`<li>✗ 不兼容：${x}</li>`).join('')}</ul>
    </div>`:'';
    return ruleBanner('s1')+`<div class="type-box">
      ${checkHtml([
        {k:'ok',t:'PCR Type（已确认）',d:PARSE.pcrType},
        {k:'ok',t:'变更对象',d:ex.sku||'CPU SKU'},
        {k:'ok',t:'变更动作',d:ex.action}
      ])}
      <div class="type-toast" style="margin-top:10px">已切换至 <b>${PARSE.pcrType}</b> 模板<br>
        保留 ${map.keep} 个可映射字段 · ${map.drop} 个字段不兼容，已标注
        <button class="btn btn-ghost" type="button" style="margin-left:6px;padding:2px 8px;font-size:12px"
          onclick="event.stopPropagation();toggleTypeMapDetail()">查看详情</button>
      </div>
      ${detail}
      <div style="margin-top:8px">${tipDots}</div>
    </div><div class="rule-note">${TYPE_RULE_FOOT}</div>`;
  }
  const opts=cands.map(c=>{
    const on=c.id===pick?' on':'';
    return `<button class="type-opt${on}" type="button" onclick="event.stopPropagation();selectTypeOpt('${c.id}')">
      <span class="to-radio">${c.id===pick?'●':'○'}</span>
      <span class="to-main">
        <span class="to-row"><span class="to-name">${c.id}</span>
          <span class="to-conf ${c.conf}">置信度 ${c.confLabel}</span></span>
        <div class="to-basis">依据：${c.basis}</div>
      </span>
    </button>`;
  }).join('');
  return ruleBanner('s1')+`<div class="type-box">
    <div class="tb-pre">你预选的类型：<b>${pre}</b> ${tipDots}</div>
    <div class="tb-h">AI 推荐类型</div>
    ${opts}
    <div class="type-warn">⚠ 确认类型后将加载对应模板并重新执行校验</div>
    <div class="type-acts">
      <button class="btn btn-primary" type="button" onclick="event.stopPropagation();confirmPcrType()">确认为 ${pick}</button>
      <button class="btn btn-ghost" type="button" onclick="event.stopPropagation();openTypePicker()">选择其他类型</button>
    </div>
  </div><div class="rule-note">${TYPE_RULE_FOOT}</div>`;
}
function selectTypeOpt(id){
  PARSE.typePick=id;
  const u=stepBy('u');if(u){u.body=typeStepBody();u.open=true;}
  renderPlist();
}
function toggleTypeMapDetail(){
  PARSE.typeMapOpen=!PARSE.typeMapOpen;
  const u=stepBy('u');if(u){u.body=typeStepBody();u.open=true;}
  renderPlist();
}
function openTypePicker(){
  const cur=PARSE.typePick||'Hardware/SBB';
  modalHost.innerHTML=`<div class="modal"><div class="modal-h"><h3>选择 PCR Type</h3><p>AI 推荐可能都不正确时，可从完整列表自行选定</p></div>
    <div class="modal-b">${PCR_TYPES.map(t=>`<label style="display:flex;align-items:center;gap:8px;padding:8px 4px;cursor:pointer;font-size:13px">
      <input type="radio" name="pcrTypePick" value="${t}" ${t===cur?'checked':''}/> ${t}
    </label>`).join('')}</div>
    <div class="modal-f"><button class="btn btn-ghost" data-x>取消</button><button class="btn btn-primary" data-ok>确认</button></div></div>`;
  scrim.classList.add('show');
  modalHost.querySelector('[data-x]').onclick=closeModal;
  modalHost.querySelector('[data-ok]').onclick=()=>{
    const sel=modalHost.querySelector('input[name=pcrTypePick]:checked');
    if(!sel){toast('请选择类型');return;}
    closeModal();
    confirmPcrType(sel.value);
  };
}
function confirmPcrType(explicit){
  const type=explicit||PARSE.typePick||'Hardware/SBB';
  PARSE.typeConfirmed=true;
  PARSE.pcrType=type;
  PARSE.typePick=type;
  PARSE.typeMap=typeMapFor(type);
  PARSE.typeMapOpen=false;
  applyTypeMeta(type);
  toast(`已切换至 ${type} 模板 · 保留 ${PARSE.typeMap.keep} 个可映射字段 · ${PARSE.typeMap.drop} 个不兼容`);
  rerunFromStep3();
  const u=stepBy('u');
  if(u){u.st='done';u.sum=type;u.open=true;u.body=typeStepBody();}
  syncStepStates();
  fillAllStepBodies(extractFields(PARSE.text));
  if(u) u.open=true;
  renderPlist();
  renderConclusion();
}
function rerunFromStep3(){
  applyTypeMeta(PARSE.pcrType);
  initSimData(false);
  const f=stepBy('f'),sm=stepBy('sim'),v=stepBy('v'),s=stepBy('s'),sp=stepBy('split');
  if(f){f.st='run';f.sum='按新模板重核';f.open=false;f.body='';}
  if(sp&&PARSE.splitDecision==null){sp.st='warn';sp.sum='AI 建议拆分';sp.open=false;sp.body='';}
  if(sm){sm.st='pending';sm.sum='找到 '+(PARSE.simCases||[]).length+' 条参考';sm.open=false;sm.body=simStepBody();}
  if(v){v.st='run';v.sum='按 Type 重算';v.open=false;v.body='';}
  if(s){s.st='wait';s.sum='待前置完成';s.pre='需先补全必填信息';s.body='';}
  fillStep3(true);
  const meta=PARSE.typeMeta||{similar:3,leadDays:18};
  const n=(PARSE.simCases||[]).length;
  if(v){
    v.body=stepBody('s4',checkHtml([
      {k:'ok',t:'引用相似 PCR 检查',d:`已检索 ${n} 条参考（${meta.similarHint||'同类'}）`},
      {k:'ok',t:'比对历史实施周期',d:`同类平均 ${meta.leadDays} 天`},
      {k:'ok',t:'分析成本影响',d:'成本叙事与 Business Case 不一致'},
      {k:'ok',t:'汇总价值判断',d:'建议补充后再提'}
    ]));
    v.st='done';v.sum='建议补充后再提';
  }
  if(s) s.body=fillStep5Body();
}

function syncStepStates(){
  const ex=extractFields(PARSE.text);
  const prod=ex.products[0]||'未识别';
  const u=stepBy('u'),p=stepBy('p'),f=stepBy('f'),sm=stepBy('sim'),v=stepBy('v'),s=stepBy('s'),sp=stepBy('split');
  if(u){
    if(PARSE.typeConfirmed&&PARSE.pcrType){u.st='done';u.sum=PARSE.pcrType;}
    else{u.st='pending';u.sum='待确认';}
  }
  if(p){p.st='done';p.sum=prod;}
  const miss=missingMustLabels();
  if(f){
    if(mustAllOk()){f.st='done';f.sum='必填已齐';}
    else{f.st='warn';f.sum=miss.length?('还差 '+miss.join('、')):'待确认';}
  }
  if(sp){
    if(PARSE.splitDecision==='split'){sp.st='done';sp.sum='已拆分为 2 条';}
    else if(PARSE.splitDecision==='keep'){sp.st='done';sp.sum='已确认不拆分';}
    else{sp.st='warn';sp.sum='AI 建议拆分';}
  }
  syncSimStepState(sm);
  if(v){
    v.st='done';v.sum='建议补充后再提';
  }
  if(s){
    if(PARSE.simDup&&!PARSE.simDupHandled){s.st='wait';s.sum='待前置完成';s.pre='存在完全重复 PCR，请先处理';}
    else if(!mustAllOk()){s.st='wait';s.sum='待前置完成';s.pre='需先补全必填信息';}
    else{s.st='done';s.sum='→ 提交至 PACE';}
  }
}

function closePlus(){const m=document.getElementById('plusmenu'),b=document.getElementById('plusbtn');
  if(m)m.classList.remove('show');if(b)b.classList.remove('on');}
function togglePlus(e){e.stopPropagation();const m=document.getElementById('plusmenu');
  const on=!m.classList.contains('show');closePlus();if(on){m.classList.add('show');document.getElementById('plusbtn').classList.add('on');hideGuide();}}
function hideGuide(){const g=document.getElementById('guide');if(g)g.classList.remove('show');}
function showGuide(){if(PARSE.active)return;document.getElementById('guide').classList.add('show');filterGuide();}
function filterGuide(){
  const q=(document.getElementById('askin').value||'').toLowerCase();
  document.querySelectorAll('#guide .guide-i').forEach(el=>{
    const hit=!q||el.textContent.toLowerCase().includes(q);
    el.classList.toggle('hide',!hit);el.classList.toggle('match',!!q&&hit);
  });
  document.querySelectorAll('#guide .guide-g').forEach(g=>{
    let n=g.nextElementSibling,any=false;
    while(n&&!n.classList.contains('guide-g')){
      if(n.classList.contains('guide-i')&&!n.classList.contains('hide')) any=true;
      n=n.nextElementSibling;
    }
    g.style.display=any?'':'none';
  });
}
function menuCreate(){closePlus();PARSE.createIntent=true;document.getElementById('askin').placeholder=PH_CREATE;
  document.getElementById('askin').focus();showGuide();
  document.querySelectorAll('#guide .guide-i[data-g=write]').forEach(x=>x.classList.add('match'));
  toast('请描述变更需求');}
function guideCreate(){menuCreate();hideGuide();}
function menuFill(q){closePlus();document.getElementById('askin').value=q;document.getElementById('askin').focus();hideGuide();}
function menuUpload(){closePlus();document.getElementById('pcrfile').click();}
function acceptDetect(){startParse(document.getElementById('askin').value.trim()||DEMO_MAIL);}
function dismissDetect(){document.getElementById('detectbar').classList.remove('show');}

function plusInit(){
  const inp=document.getElementById('askin'), box=document.getElementById('askbox'), file=document.getElementById('pcrfile');
  inp.addEventListener('focus',()=>{if(!PARSE.active)showGuide();});
  inp.addEventListener('input',()=>{if(!PARSE.active){showGuide();filterGuide();}});
  inp.addEventListener('blur',()=>{setTimeout(()=>{if(!document.activeElement||!document.activeElement.closest('.ask'))hideGuide();},180);});
  inp.addEventListener('paste',e=>{
    const txt=(e.clipboardData&&e.clipboardData.getData('text'))||'';
    setTimeout(()=>{
      const v=inp.value||txt;
      const ex=extractFields(v);
      if(ex.long||ex.looksMail){hideGuide();document.getElementById('detectbar').classList.add('show');}
    },0);
  });
  file.addEventListener('change',()=>{
    PARSE.files=[...file.files];
    toast('已添加 '+(PARSE.files.length)+' 个附件');
    if(!PARSE.createIntent){PARSE.createIntent=true;inp.placeholder=PH_CREATE;}
  });
  ;['dragenter','dragover'].forEach(ev=>box.addEventListener(ev,e=>{e.preventDefault();box.classList.add('drop-on');}));
  ;['dragleave','drop'].forEach(ev=>box.addEventListener(ev,e=>{e.preventDefault();box.classList.remove('drop-on');}));
  box.addEventListener('drop',e=>{
    const fs=[...e.dataTransfer.files];if(!fs.length)return;
    PARSE.files=fs;toast('已添加 '+fs.length+' 个附件');PARSE.createIntent=true;inp.placeholder=PH_CREATE;
  });
  document.addEventListener('click',e=>{
    if(!e.target.closest('#plusmenu')&&!e.target.closest('#plusbtn'))closePlus();
  });
  document.addEventListener('click',e=>{
    if(!PARSE.animating||PARSE.skipped)return;
    if(e.target.closest('button,input,textarea,a,.iinfo,.tipdot,.plusmenu,.iss-card,.submit-dock'))return;
    skipParse();
  });
}

function newChatSession(){
  if(window.Sessions) Sessions.onNewChat();
  if(PARSE.active||PARSE.suspended||PARSE.text){
    exitParseMode();
  }
  if(window.HomePins&&HomePins.clearAnalysis) HomePins.clearAnalysis();
  document.querySelector('.scroll').scrollTop=0;
  toast('已新建会话');
  const inp=document.getElementById('askin');if(inp){inp.value='';inp.focus();}
}
function clearParseTimers(){PARSE.timers.forEach(id=>clearTimeout(id));PARSE.timers=[];}
function later(ms,fn){PARSE.timers.push(setTimeout(fn,ms));}

function startParse(text){
  if(window.HomePins&&HomePins.clearAnalysis) HomePins.clearAnalysis();
  PARSE.text=text||DEMO_MAIL;PARSE.createIntent=false;PARSE.skipped=false;
  PARSE.split=/vPro/i.test(PARSE.text)&&/non-vPro/i.test(PARSE.text);
  PARSE.typeConfirmed=false;PARSE.pcrType=null;PARSE.typePick='Hardware/SBB';
  PARSE.preselectedType=null;PARSE.typeMap=null;PARSE.typeMapOpen=false;
  PARSE.submitted=false;PARSE.pcrNumber=null;PARSE.submitAt=null;PARSE.histMark=null;
  PARSE.fillEditing=false;PARSE.fillSnapshot=null;PARSE.withdrawLog=null;
  applyTypeMeta('Hardware/SBB');
  initSimData(false);
  initParseFields(extractFields(PARSE.text));
  document.getElementById('detectbar').classList.remove('show');
  document.getElementById('askin').value='';
  hideGuide();closePlus();
  enterParseMode();
  const ex=extractFields(PARSE.text);
  setParseUser(PARSE.text);
  runParseAnim(ex);
}

function showParseHist(){
  if(window.Sessions){ Sessions.syncCreateFromParse(); return; }
  const el=document.getElementById('parseHistItem');
  if(!el)return;
  el.style.display='';
  document.body.classList.add('has-parse-session');
  const ex=extractFields(PARSE.text||'');
  const prod=(ex.products[0]||'变更').replace('ThinkPad ','');
  const title=document.getElementById('parseHistTitle');
  if(title) title.textContent=prod+' CPU SKU 变更 · 解析中';
  updateParseHistMark();
}
function updateParseHistMark(){
  if(window.Sessions){ Sessions.syncCreateFromParse(); return; }
  const el=document.getElementById('parseHistItem');
  if(!el)return;
  const hm=el.querySelector('.hm');
  if(!hm)return;
  if(PARSE.submitted){hm.textContent='已提交';hm.className='hm live';}
  else if(PARSE.histMark==='draft'){hm.textContent='草稿';hm.className='hm';}
  else if(PARSE.histMark==='withdrawn'){hm.textContent='已撤回';hm.className='hm';}
  else{hm.textContent='进行中';hm.className='hm live';}
}
function hideParseHist(){
  if(window.Sessions){
    Sessions.markCreateGone(!!(PARSE.submitted || PARSE.histMark==='draft' || PARSE.histMark==='withdrawn'));
    return;
  }
  const el=document.getElementById('parseHistItem');
  if(el) el.style.display='none';
  document.body.classList.remove('has-parse-session');
}

function enterParseMode(){
  PARSE.active=true;PARSE.homeOpen=false;PARSE.suspended=false;
  document.body.classList.add('parsing');document.body.classList.remove('home-open','taskview');
  showParseHist();
  document.getElementById('plist').classList.remove('mini');
  const caret=document.getElementById('parseBarCaret');if(caret)caret.textContent='▾';
  document.getElementById('askin').placeholder=PH_MORE;
  document.querySelector('.scroll').scrollTop=0;
  document.getElementById('parseUser').innerHTML='';
  document.getElementById('parseChat').innerHTML='';
}

/** 临时离开解析页：隐藏 UI，保留字段/步骤/原文，左侧历史仍可点回 */
function suspendParse(){
  if(!PARSE.text && !PARSE.steps.length) return;
  clearParseTimers();
  PARSE.active=false;PARSE.homeOpen=false;PARSE.animating=false;PARSE.suspended=true;
  document.body.classList.remove('parsing','home-open');
  document.getElementById('askin').placeholder=PH_ASK;
  const pl=document.getElementById('plist');if(pl)pl.classList.remove('mini');
  showParseHist();
}

/** 结束会话（提交成功 / 新建会话）：清空并隐藏历史项 */
function exitParseMode(){
  const keepSess = !!(PARSE.submitted || PARSE.histMark==='draft' || PARSE.histMark==='withdrawn');
  clearParseTimers();
  PARSE.active=false;PARSE.createIntent=false;PARSE.homeOpen=false;PARSE.animating=false;PARSE.suspended=false;
  PARSE.text='';PARSE.steps=[];PARSE.fields=null;PARSE.issues={};PARSE.splitDecision=null;PARSE.issueOpen={};
  PARSE.typeConfirmed=false;PARSE.pcrType=null;PARSE.typePick=null;PARSE.preselectedType=null;
  PARSE.typeMap=null;PARSE.typeMapOpen=false;PARSE.typeMeta=null;
  PARSE.simConfirmed=false;PARSE.simDup=null;PARSE.simDupHandled=false;PARSE.simCases=[];
  PARSE.simRefOpen={};PARSE.simCompareOpen=false;PARSE.simCompareId=null;
  PARSE.submitted=false;PARSE.pcrNumber=null;PARSE.submitAt=null;PARSE.histMark=null;
  PARSE.fillEditing=false;PARSE.fillSnapshot=null;PARSE.withdrawLog=null;
  document.body.classList.remove('parsing','home-open');
  document.getElementById('askin').placeholder=PH_ASK;
  const pl=document.getElementById('plist');if(pl){pl.classList.remove('mini');pl.innerHTML='';}
  const pu=document.getElementById('parseUser');if(pu)pu.innerHTML='';
  const pc=document.getElementById('parseChat');if(pc)pc.innerHTML='';
  if(window.Sessions) Sessions.markCreateGone(keepSess);
  else hideParseHist();
}

function ensureHomeView(){
  if(VIEW==='home')return;
  VIEW='home'; NOTES=ALL.home; TIPS=TIPS_HOME;
  document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('on',el.dataset.view==='home'));
  document.getElementById('view-home').style.display='';
  document.getElementById('view-task').style.display='none';
  document.getElementById('crumb').textContent='Overview';
  document.body.classList.remove('taskview');
  const ask=document.getElementById('askwrap');if(ask)ask.style.display='';
}

function resumeParse(){
  if(!PARSE.text && !(PARSE.steps&&PARSE.steps.length)){
    toast('没有进行中的解析会话');
    return;
  }
  if(!PARSE.text) PARSE.text=DEMO_MAIL;
  ensureHomeView();
  // 恢复解析 UI：不走 enterParseMode，避免清空已有 DOM
  PARSE.active=true;PARSE.homeOpen=false;PARSE.suspended=false;PARSE.animating=false;
  document.body.classList.add('parsing');
  document.body.classList.remove('home-open','taskview');
  showParseHist();
  const pl=document.getElementById('plist');if(pl)pl.classList.remove('mini');
  const caret=document.getElementById('parseBarCaret');if(caret)caret.textContent='▾';
  document.getElementById('askin').placeholder=PH_MORE;
  if(!PARSE.fields) initParseFields(extractFields(PARSE.text));
  const needUser=!document.querySelector('#parseUser .bub');
  const needSteps=!document.querySelector('#plist .pstep');
  const needAi=!document.querySelector('#parseChat .tl-item');
  if(needUser) setParseUser(PARSE.text);
  if(needSteps||needAi||!PARSE.steps.length){
    finishParse(extractFields(PARSE.text));
  }else{
    syncStepStates();
    collapseAllSteps();
    renderPlist();
    renderConclusion();
  }
  document.querySelector('.scroll').scrollTop=0;
  const layer=document.getElementById('parseLayer');
  if(layer) layer.scrollIntoView({block:'start'});
}

function toggleHomeFold(){
  // 兼容旧调用：改为返回总览
  backToOverview();
}
function backToOverview(){
  ensureHomeView();
  suspendParse();
  document.querySelector('.scroll').scrollTop=0;
}
function collapsePlistToHome(){backToOverview();}

function setParseUser(t){
  const el=document.getElementById('parseUser');
  el.innerHTML=`<div class="bub me">${(t||'').replace(/</g,'&lt;')}</div>`;
}
function clearParseAI(){document.getElementById('parseChat').innerHTML='';}
function collapseAllSteps(){PARSE.steps.forEach(s=>s.open=false);}
function toggleIssue(id){
  PARSE.issueOpen[id]=!PARSE.issueOpen[id];
  renderConclusion();
}
function toggleAllIssues(){
  const rows=['bc','geo','target','nre'];
  const openAll=rows.some(id=>!PARSE.issueOpen[id]);
  rows.forEach(id=>PARSE.issueOpen[id]=openAll);
  PARSE.issueExpandAll=openAll;
  renderConclusion();
}
function toggleThink(){/* 解析过程入口已改为分隔线，保留空函数避免旧调用报错 */}
function renderConclusion(){
  const host=document.getElementById('parseChat');
  const iss=PARSE.issues||{};
  if(!PARSE.issueOpen) PARSE.issueOpen={};
  const rows=[
    {id:'bc',ic:'warn',cls:'warn',title:'Business Case 与原文不符',
      lines:[`原文强调 <b>"better cost and same performance"</b>`,`当前填写：<b>${PARSE.fields.bc.val||'Marketing Request'}</b>`,`建议改为：<b>Cost Saving</b>`],
      acts:iss.bc?null:`<button class="btn btn-primary" type="button" onclick="resolveIssue('bc','adopt')">采纳建议</button><button class="btn btn-ghost" type="button" onclick="resolveIssue('bc','keep')">保持不变</button>`,
      done:iss.bc,doneTxt:iss.bc==='adopt'?'已改为 Cost Saving':'已保持 Marketing Request'},
    {id:'geo',ic:'err',cls:'err',title:'Geo Impact 范围存疑',
      lines:[`原文未提及任何区域信息`,`当前填写：<b>${PARSE.fields.geo.val||'PRC（默认草稿）'}</b>`,`Intel SKU 变更通常为全球性，确认只影响 PRC 吗？`],
      acts:iss.geo?null:`<button class="btn btn-primary" type="button" onclick="resolveIssue('geo','ww')">改为 WW</button><button class="btn btn-ghost" type="button" onclick="resolveIssue('geo','prc')">确认仅 PRC</button><button class="btn btn-ghost" type="button" onclick="resolveIssue('geo','later')">稍后处理</button>`,
      done:iss.geo&&iss.geo!=='later',doneTxt:iss.geo==='ww'?'已改为 WW':iss.geo==='prc'?'已确认仅 PRC':''},
    {id:'target',ic:'err',cls:'err',title:'目标实施日不合理',
      lines:[`目标实施日 <b>2025-08-25</b> 与创建日相同`,`建议按 Lead Time 反推合理日期（同类约 18 天）`],
      acts:iss.target?null:`<button class="btn btn-primary" type="button" onclick="resolveIssue('target','ai')">让 AI 推算</button><button class="btn btn-ghost" type="button" onclick="resolveIssue('target','manual')">手动填写</button>`,
      done:!!iss.target,doneTxt:iss.target==='ai'?'已改为 2025-09-12':'已手动确认日期'},
    {id:'nre',ic:'info',cls:'info',title:'NRE 信息可量化',
      lines:[`原文明确 <b>"no increase to PCBA or NRE"</b>`,`建议提取到 Profit Impact 字段`],
      acts:iss.nre?null:`<button class="btn btn-primary" type="button" onclick="resolveIssue('nre','write')">写入 Profit Impact</button><button class="btn btn-ghost" type="button" onclick="resolveIssue('nre','skip')">忽略</button>`,
      done:!!iss.nre,doneTxt:iss.nre==='write'?'已写入 Profit Impact':'已忽略'}
  ];
  const openCount=rows.filter(r=>!r.done&&!(r.id==='geo'&&iss.geo==='later')).length;
  let html=`<div class="parse-ai">
    <hr class="parse-sep" aria-hidden="true">
    <p class="ai-lead">发现 ${rows.length} 个需要你确认的问题${openCount?`，还剩 ${openCount} 项待处理`:''}。点开每一项即可处理。</p>
    <div class="tl-wrap">
      <button type="button" class="tl-expandall" title="展开/收起全部" onclick="toggleAllIssues()">↕</button>
      <div class="tl">`;
  rows.forEach((r,i)=>{
    const opened=!!PARSE.issueOpen[r.id];
    const icon=r.done?'✓':(r.ic==='warn'?'!':r.ic==='err'?'✗':'ⓘ');
    html+=`<div class="tl-item ${r.cls}${r.done?' done-iss':''}${opened?' open':''}${i===rows.length-1?' last':''}" data-iss="${r.id}">
      <button type="button" class="tl-h" onclick="toggleIssue('${r.id}')">
        <span class="tl-dot">${icon}</span>
        <span class="tl-t">${r.title}</span>
        <span class="tl-chev">›</span>
      </button>
      <div class="tl-b">
        ${r.lines.map(l=>`<div class="id">${l}</div>`).join('')}
        ${r.done?`<div class="id"><b>${r.doneTxt}</b></div>`:''}
        ${r.acts?`<div class="iact">${r.acts}</div>`:''}
        <div class="rule-note">${RULE_FOOT}</div>
      </div>
    </div>`;
  });
  html+=`</div></div>`;
  if(mustAllOk()){
    html+=renderSubmitDockHtml();
  }else{
    html+=`<div class="submit-dock" style="opacity:.85"><div class="sd-note">必须项全部通过后，将在此处显示「提交至 PACE」。当前还差：${missingMustLabels().join('、')||'待确认项'}。</div></div>`;
  }
  html+='</div>';
  host.innerHTML=html;
  if(PARSE._animateConclusion && window.DialogueMotion){
    PARSE._animateConclusion=false;
    animateParseConclusion(host);
  }
}

async function animateParseConclusion(host){
  const DM=window.DialogueMotion;
  if(!DM||DM.reduced()||window.__DM_DISABLE) return;
  const scrollRoot=document.querySelector('.scroll');
  DM.bindSkip(host);
  DM._bindScrollFollow(scrollRoot);
  DM._skip=false; DM._running=true;
  try{
    const lead=host.querySelector('.ai-lead');
    const tl=host.querySelector('.tl-wrap');
    const docks=[...host.querySelectorAll('.submit-dock')];
    const fullLead=lead?lead.textContent.trim():'';
    if(tl){tl.hidden=true;tl.classList.add('dm-pending');}
    docks.forEach(d=>{d.hidden=true;d.classList.add('dm-pending');});
    if(lead && fullLead){
      lead.textContent='';
      await DM.streamText(lead, fullLead, scrollRoot);
    }
    if(tl){
      await DM.revealEl(tl, scrollRoot);
      // 警告/错误项后出现：先 info，再 warn，再 err
      const items=[...tl.querySelectorAll('.tl-item')];
      items.forEach(it=>{
        it.classList.add('dm-li-pending');
        const dot=it.querySelector('.tl-dot');
        if(dot){dot.dataset.dmFinal=dot.innerHTML;dot.innerHTML='<span class="dm-spin"></span>';}
      });
      const rank=it=>it.classList.contains('err')?2:it.classList.contains('warn')?1:0;
      items.sort((a,b)=>rank(a)-rank(b));
      let seenBad=false;
      for(const it of items){
        if(rank(it)>0 && !seenBad){seenBad=true;await DM.sleep(DM.isSkipping()?0:400);}
        it.classList.remove('dm-li-pending');it.classList.add('dm-li-in');
        const dot=it.querySelector('.tl-dot');
        if(dot&&dot.dataset.dmFinal!=null){
          await DM.sleep(DM.isSkipping()?0:160);
          dot.innerHTML=dot.dataset.dmFinal;
        }
        DM.scrollToBottom(scrollRoot);
        await DM.sleep(DM.isSkipping()?0:220);
      }
    }
    for(const d of docks){
      await DM.sleep(DM.isSkipping()?0:200);
      d.hidden=false;d.classList.remove('dm-pending');
      d.classList.add('dm-fade');requestAnimationFrame(()=>d.classList.add('dm-in'));
      DM.scrollToBottom(scrollRoot);
    }
  } finally {
    DM._running=false;DM._skip=false;DM._unfollowScroll();
  }
}

function resolveIssue(id,act){
  PARSE.issues[id]=act;
  if(id==='bc'){
    if(act==='adopt'){PARSE.fields.bc.k='ok';PARSE.fields.bc.val='Cost Saving';PARSE.fields.bc.d='Cost Saving（已按原文成本优势修正）';}
    else{PARSE.fields.bc.k='ok';PARSE.fields.bc.d='Marketing Request（已确认保持）';}
  }
  if(id==='geo'){
    if(act==='ww'){PARSE.fields.geo.k='ok';PARSE.fields.geo.val='WW';PARSE.fields.geo.d='WW';}
    else if(act==='prc'){PARSE.fields.geo.k='ok';PARSE.fields.geo.val='PRC';PARSE.fields.geo.d='PRC（已确认仅 PRC）';}
    else{toast('Geo 稍后处理，仍计为未完成');}
  }
  if(id==='target'){
    PARSE.fields.target.k='ok';
    PARSE.fields.target.val=act==='ai'?'2025-09-12':'2025-09-01';
    PARSE.fields.target.d=PARSE.fields.target.val+(act==='ai'?'（按 Lead Time 反推）':'（手动确认）');
  }
  if(id==='nre'){
    if(act==='write'){PARSE.fields.nre.k='ok';PARSE.fields.nre.d='已写入：PCBA/NRE 无增加';PARSE.fields.nre.val='no increase';}
    else{PARSE.fields.nre.k='ok';PARSE.fields.nre.d='已忽略';}
  }
  refreshParseUI(true);
  toast(act==='later'?'已标记稍后处理':'已更新字段与清单');
}

function refreshParseUI(keepOpen){
  const openId=keepOpen?(PARSE.steps.find(s=>s.open)||{}).id:null;
  syncStepStates();
  fillAllStepBodies(extractFields(PARSE.text));
  if(openId){PARSE.steps.forEach(s=>s.open=(s.id===openId));}
  else{collapseAllSteps();}
  renderPlist();
  renderConclusion();
}

function stepState(id,st,sum){const n=PARSE.steps.find(s=>s.id===id);if(!n)return;n.st=st;if(sum!=null)n.sum=sum;}

function renderPlist(){
  const host=document.getElementById('plist');
  const total=PARSE.steps.length;
  const done=PARSE.steps.filter(s=>s.st==='done').length;
  const cur=PARSE.steps.find(s=>s.st==='run')||PARSE.steps.find(s=>s.st==='warn')||PARSE.steps.find(s=>s.st==='err')||PARSE.steps.find(s=>s.st==='pending');
  const mini=host.classList.contains('mini');
  const steps=PARSE.steps.filter(s=>!mini||s.st==='run'||s.st==='warn'||s.st==='pending'||s.st==='err');
  host.innerHTML=`<div class="plist-h" onclick="togglePlistMini()">
    <h3>${mini?('Submit PCR · '+(cur?cur.title:'')):'Submit PCR'}</h3>
    <span class="pcnt">${mini?((cur&&cur.sum)||''):(done+'/'+total+' 已完成')}</span>
    <button type="button" class="plist-toggle" title="展开/收起步骤" onclick="event.stopPropagation();toggleAllSteps()">${PARSE.steps.some(s=>s.open)?'▴':'▾'}</button>
    <span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrList',38)">38</span>
    <span class="tipdot" onclick="event.stopPropagation();showTip(event,'pcrCount',42)">42</span>
  </div>`;
  steps.forEach((s,i)=>{
    const row=document.createElement('div');
    const stCls=s.st==='warn'?'warn':s.st;
    row.className='pstep '+stCls+(s.open?' open':'')+(s.dyn?' warn-step':'')+(i===steps.length-1?' last':'');
    row.dataset.id=s.id;
    const icon=s.st==='done'?'✓':s.st==='pending'?'◇':s.st==='err'?'✗':(s.st==='warn'||s.dyn)?'!':s.st==='run'?'':'○';
    row.innerHTML=`<button class="pstep-h" type="button">
      <span class="pico">${icon}</span><span class="ptt">${s.title}</span>
      <span class="psum" title="${(s.sum||'').replace(/"/g,'&quot;')}">${s.sum||''}</span>
      <span class="chev">›</span>
      <span class="iinfo" data-info="${s.info}">ⓘ</span>
    </button><div class="pstep-b">${s.body||''}</div>`;
    row.querySelector('.pstep-h').onclick=()=>clickStep(s.id);
    row.querySelector('.iinfo').onclick=ev=>{ev.stopPropagation();openStepInfo(s.info);};
    host.appendChild(row);
  });
  if(!PARSE.animating) host.querySelectorAll('.pcheck').forEach(el=>el.classList.add('in'));
  if(!mini) host.insertAdjacentHTML('beforeend',`<div class="plist-sub" style="padding:4px 0 0"><span class="tipdot" onclick="showTip(event,'pcrRules',39)">39</span> <span class="tipdot" onclick="showTip(event,'pcrDyn',40)">40</span></div>`);
}
function toggleAllSteps(){
  const any=PARSE.steps.some(s=>s.open);
  if(any) collapseAllSteps();
  else PARSE.steps.forEach(s=>{if(s.st!=='wait')s.open=true;});
  if(!PARSE.steps.some(s=>s.body)) fillAllStepBodies(extractFields(PARSE.text));
  renderPlist();
}

function togglePlistMini(){
  const el=document.getElementById('plist');
  if(el.classList.contains('mini')){collapsePlistToHome();return;}
  el.classList.add('mini');
  renderPlist();
}

function clickStep(id){
  const s=PARSE.steps.find(x=>x.id===id);if(!s)return;
  if(s.st==='wait'){toast(s.pre||'需先补全必填信息');return;}
  const was=s.open;
  PARSE.steps.forEach(x=>x.open=false);
  s.open=!was;
  if(!s.body) fillAllStepBodies(extractFields(PARSE.text));
  renderPlist();
}

function openStepInfo(key){
  const map={
    s1:{t:'步骤 1 · 理解变更内容',b:'AI 推荐 PCR Type（至少两个候选，各带依据与置信度），须用户确认后才生效；同时识别变更对象、变更动作与 CP/SP。'},
    s2:{t:'步骤 2 · 识别影响产品',b:'识别产品线/机型、MTM、Geo、CP Team。产品名须匹配主数据；原文未提区域不默认 WW；跨产品线时提示拆分。'},
    s3:{t:'步骤 3 · 补全必填信息',b:'必须项：Impacted Products、Business Case Reason、Target Implementation Date、Geo Impact、Change Request 完整性。建议项不阻断提交。'},
    ssim:{t:'步骤 4 · 相似 PCR 检查',b:'上半：重复性检查（硬阻断）；下半：相似案例参考（Comment/Cost/Assessment 与 Return 教训）。须用户确认已参考。'},
    s4:{t:'步骤 5 · 可行性与价值评估',b:'技术/时间/价值三维度。引用相似 PCR 检查结论。AI 给建议，人做决定。'},
    s5:{t:'步骤 6 · 提交验证',b:'核对 Type、必填、逻辑一致性与拆分建议。重复检索已并入相似 PCR 步骤。提交后在 PACE 创建记录并进入 Review。'}
  };
  const d=map[key]||map.s1;
  modalHost.innerHTML=`<div class="modal"><div class="modal-h"><h3>${d.t}</h3></div><div class="modal-b"><p style="font-size:13px;line-height:1.65;color:var(--ink-2)">${d.b}</p><div class="rule-note">${RULE_FOOT}</div></div><div class="modal-f"><button class="btn btn-primary" data-x>知道了</button></div></div>`;
  scrim.classList.add('show');modalHost.querySelector('[data-x]').onclick=closeModal;
}

function skipParse(){
  if(!PARSE.active||PARSE.skipped)return;
  PARSE.skipped=true;PARSE.animating=false;clearParseTimers();
  finishParse(extractFields(PARSE.text));
}

function runParseAnim(ex){
  PARSE.animating=true;PARSE.skipped=false;
  const prod=ex.products[0]||'未识别产品';
  PARSE.typePick=PARSE.typePick||'Hardware/SBB';
  if(!PARSE.simCases||!PARSE.simCases.length) initSimData(false);
  PARSE.steps=[
    {id:'u',title:'理解变更内容',st:'run',sum:'识别中',info:'s1',open:true,body:'',pre:''},
    {id:'p',title:'识别影响产品',st:'wait',sum:'待前置完成',info:'s2',open:false,body:'',pre:'需先理解变更内容'},
    {id:'f',title:'补全必填信息',st:'wait',sum:'待前置完成',info:'s3',open:false,body:'',pre:'需先识别影响产品'},
    {id:'sim',title:'相似 PCR 检查',st:'wait',sum:'待前置完成',info:'ssim',open:false,body:'',pre:'需先补全必填信息'},
    {id:'v',title:'可行性与价值评估',st:'wait',sum:'待前置完成',info:'s4',open:false,body:'',pre:'需先完成相似 PCR 检查'},
    {id:'s',title:'提交验证',st:'wait',sum:'待前置完成',info:'s5',open:false,body:'',pre:'需先补全必填信息'}
  ];
  if(PARSE.split){
    PARSE.steps.splice(3,0,{id:'split',title:'确认是否拆分为两条',st:'wait',sum:'待前置完成',info:'s2',open:false,dyn:true,pre:'需先进入补全步骤'});
  }
  PARSE.steps[0].body=ruleBanner('s1')+`<div class="rule-note">${TYPE_RULE_FOOT}</div>`;
  renderPlist();
  later(200,()=>{
    PARSE.steps[0].body=typeStepBody();
    renderPlist();
  });
  later(900,()=>{PARSE.steps[0].st='pending';PARSE.steps[0].sum='待确认';PARSE.steps[0].open=false;
    PARSE.steps[0].body=typeStepBody();
    PARSE.steps[1].st='run';PARSE.steps[1].open=true;PARSE.steps[1].sum='识别中';
    PARSE.steps[1].body=ruleBanner('s2')+`<div class="rule-note">${RULE_FOOT}</div>`;
    renderPlist();
  });
  later(1600,()=>{
    PARSE.steps[1].body=stepBody('s2',checkHtml([
      {k:'ok',t:'影响产品',d:prod},
      {k:ex.geo?'ok':'err',t:'Geo Impact',d:ex.geo||'原文未提及区域 · 不默认 WW'}
    ]));
    renderPlist();inChecks();
  });
  later(2200,()=>{PARSE.steps[1].st='done';PARSE.steps[1].sum=prod;PARSE.steps[1].open=false;
    const f=stepBy('f');
    if(f){f.st='run';f.open=true;f.sum='核对中';f.body=ruleBanner('s3')+`<div class="rule-note">${RULE_FOOT}</div>`;}
    renderPlist();
  });
  later(2500,()=>fillStep3(false));
  later(5200,()=>fillSimStep(false));
  later(6200,()=>fillStep4());
  later(7200,()=>{PARSE.animating=false;finishParse(ex);});
}

function checkHtml(items){
  return items.map(i=>`<div class="pcheck ${i.k}"><span class="ck">${i.k==='ok'?'✓':i.k==='warn'?'⚠':i.k==='run'?'◐':i.k==='info'?'ⓘ':i.k==='wait'?'○':'✗'}</span><div><b>${i.t}</b>　${i.d}</div></div>`).join('');
}
function inChecks(){document.querySelectorAll('.pstep.open .pcheck').forEach((el,i)=>later(i*300,()=>el.classList.add('in')));}
function stepBy(id){return PARSE.steps.find(s=>s.id===id);}

function fillStep3Html(){
  const g=fieldGroups();
  const mustPct=Math.round(g.mustDone/g.mustTotal*100);
  const sugPct=Math.round(g.sugDone/g.sugTotal*100);
  const mid=`
    <div class="pfill"><span>必须补充　${g.mustDone}/${g.mustTotal} 已完成</span><div class="pbar"><i style="width:${mustPct}%"></i></div></div>
    <div class="pfill"><span>建议补充　${g.sugDone}/${g.sugTotal} 已完成</span><div class="pbar"><i style="width:${sugPct}%"></i></div></div>
    <div class="pgrp"><div class="pgrp-h">必须项</div>${checkHtml(g.must)}</div>
    <div class="pgrp"><div class="pgrp-h">建议项</div>${checkHtml(g.sug)}</div>`;
  return stepBody('s3',mid);
}

function fillStep3(instant){
  const f=stepBy('f');if(!f)return;
  f.body=fillStep3Html();
  const miss=missingMustLabels();
  if(mustAllOk()){f.st='done';f.sum='必填已齐';}
  else{f.st=PARSE.animating?'run':'warn';f.sum=miss.length?('还差 '+miss.join('、')):'待确认';}
  renderPlist();
  const items=document.querySelectorAll('.pstep.open .pcheck');
  if(instant||!PARSE.animating){items.forEach(x=>x.classList.add('in'));return;}
  const warn=[...items].filter(x=>x.classList.contains('warn')||x.classList.contains('err')||x.classList.contains('info')||x.classList.contains('wait'));
  const ok=[...items].filter(x=>x.classList.contains('ok'));
  ok.forEach((el,i)=>later(300*i,()=>el.classList.add('in')));
  later(300*ok.length+400,()=>warn.forEach((el,i)=>later(350*i,()=>el.classList.add('in'))));
}

function fillSimStep(instant){
  const f=stepBy('f');
  if(f){f.open=false;const miss=missingMustLabels();f.st=mustAllOk()?'done':'warn';f.sum=mustAllOk()?'必填已齐':(miss.length?('还差 '+miss.join('、')):'待确认');}
  const sp=stepBy('split');
  if(sp&&PARSE.splitDecision==null){sp.st='warn';sp.sum='AI 建议拆分';sp.body=splitBody();}
  if(!PARSE.simCases||!PARSE.simCases.length) initSimData(!!PARSE.simDup);
  const sm=stepBy('sim');if(!sm)return;
  sm.st='run';sm.open=true;sm.sum='检索中';
  sm.body=ruleBanner('ssim')+`<div class="rule-note">${RULE_FOOT}</div>`;
  renderPlist();
  const done=()=>{
    if(PARSE.skipped&&!instant)return;
    sm.body=simStepBody();
    syncSimStepState(sm);
    sm.open=true;
    renderPlist();
  };
  if(instant||!PARSE.animating){done();return;}
  later(600,done);
}

function fillStep4(){
  const sm=stepBy('sim');
  if(sm){sm.open=false;syncSimStepState(sm);}
  const sp=stepBy('split');
  if(sp&&PARSE.splitDecision==null){sp.st='warn';sp.sum='AI 建议拆分';sp.body=splitBody();}
  if(!PARSE.typeMeta) applyTypeMeta(effectiveType());
  const meta=PARSE.typeMeta;
  const n=(PARSE.simCases||[]).length;
  const ix=PARSE.steps.findIndex(s=>s.id==='v');
  if(ix<0)return;
  PARSE.steps[ix].st='run';PARSE.steps[ix].open=true;PARSE.steps[ix].sum='分析中';
  PARSE.steps[ix].body=stepBody('s4',checkHtml([
    {k:'ok',t:'引用相似 PCR 检查',d:`已检索 ${n} 条参考`},
    {k:'ok',t:'比对历史实施周期',d:`同类平均 ${meta.leadDays} 天`},
    {k:'run',t:'分析成本影响',d:'进行中…'},
    {k:'wait',t:'汇总价值判断',d:''}
  ]));
  renderPlist();inChecks();
  later(700,()=>{
    if(PARSE.skipped)return;
    PARSE.steps[ix].body=stepBody('s4',checkHtml([
      {k:'ok',t:'引用相似 PCR 检查',d:`已检索 ${n} 条参考（${meta.similarHint||'同类'}）`},
      {k:'ok',t:'比对历史实施周期',d:`同类平均 ${meta.leadDays} 天`},
      {k:'ok',t:'分析成本影响',d:'成本叙事与 Business Case 不一致'},
      {k:'ok',t:'汇总价值判断',d:'建议补充后再提'}
    ]));
    PARSE.steps[ix].st='done';PARSE.steps[ix].sum='建议补充后再提';PARSE.steps[ix].open=false;
    renderPlist();
  });
}

function splitBody(){
  return `<div style="font-size:12.5px;line-height:1.65;color:var(--ink-2)">
    <div style="font-weight:600;color:var(--ink);margin-bottom:6px">判定依据</div>
    <p>一条 PCR 应对应一个独立的变更动作。本次描述中识别到可能存在两个独立变更：</p>
    <div style="margin:10px 0;padding:10px 12px;background:var(--soft);border-radius:8px">
      <b>① CPU SKU 替换</b><br>MS5 X9 12Xe vPro → T6 X9 12Xe non-vPro<br>变更类型：Hardware/SBB
    </div>
    <div style="margin:10px 0;padding:10px 12px;background:var(--soft);border-radius:8px">
      <b>② CPU List 维护</b><br>原文 "change … on CPU list"<br>可能属于配置清单更新，与硬件替换是不同动作
    </div>
    <p>拆分后：主 PCR 处理 SKU 替换，Branch PCR 处理 CPU List 更新，两者可并行推进。</p>
    <div class="split-acts">
      <button class="btn btn-primary" type="button" onclick="event.stopPropagation();decideSplit('split')">拆分为两条</button>
      <button class="btn btn-ghost" type="button" onclick="event.stopPropagation();decideSplit('keep')">不拆分，说明理由</button>
      <button class="btn btn-ghost" type="button" onclick="event.stopPropagation();decideSplit('later')">稍后决定</button>
    </div>
    <div class="rule-note">${RULE_FOOT}</div>
  </div>`;
}

function decideSplit(act){
  if(act==='keep'){
    modalHost.innerHTML=`<div class="modal"><div class="modal-h"><h3>确认不拆分</h3><p>请说明为何合并为一条 PCR</p></div>
      <div class="modal-b"><textarea class="reason" id="splitReason" placeholder="例如：CPU List 更新是本次 SKU 替换的附属动作…"></textarea></div>
      <div class="modal-f"><button class="btn btn-ghost" data-x>取消</button><button class="btn btn-primary" data-ok>确认</button></div></div>`;
    scrim.classList.add('show');
    modalHost.querySelector('[data-x]').onclick=closeModal;
    modalHost.querySelector('[data-ok]').onclick=()=>{
      const r=(document.getElementById('splitReason').value||'').trim();
      if(!r){toast('请填写不拆分理由');return;}
      PARSE.splitDecision='keep';PARSE.splitReason=r;closeModal();refreshParseUI(true);toast('已确认不拆分');
    };
    return;
  }
  if(act==='later'){PARSE.splitDecision=null;const sp=stepBy('split');if(sp){sp.st='warn';sp.sum='AI 建议拆分';sp.open=true;sp.body=splitBody();}renderPlist();toast('稍后决定，不阻塞后续步骤');return;}
  PARSE.splitDecision='split';refreshParseUI(true);toast('已拆分为 2 条 PCR');
}

function fillStep5Body(){
  const ready=mustAllOk();
  const typ=PARSE.typeConfirmed&&PARSE.pcrType?PARSE.pcrType:'（未确认）';
  const typeOk=PARSE.typeConfirmed?'ok':'warn';
  const splitOk=PARSE.splitDecision==='split'||PARSE.splitDecision==='keep'||!PARSE.split;
  const checks=checkHtml([
    {k:typeOk,t:'PCR Type 合理性',d:PARSE.typeConfirmed?(typ+' 与变更内容匹配'):'类型待用户确认'},
    {k:ready?'ok':'warn',t:'必填字段完整性',d:ready?'已齐备':'Geo、目标实施日或 Business Case 待确认'},
    {k:ready?'ok':'warn',t:'字段间逻辑一致性',d:ready?'成本叙事与 Business Case 已对齐或已标注':'待补齐字段后再核'},
    {k:splitOk?'ok':'warn',t:'拆分建议确认状态',d:PARSE.splitDecision==='split'?'已拆分为 2 条':PARSE.splitDecision==='keep'?'已确认不拆分':(PARSE.split?'待确认是否拆分':'无需拆分')}
  ]);
  return stepBody('s5',checks,`<div style="font-size:12.5px;margin-top:10px;line-height:1.6;color:var(--ink-2)">提交验证通过后，将在对话区末尾提交至 <b>PACE</b> 并进入 <b>Review</b>。<span class="tipdot" onclick="showTip(event,'pcrPace',43)">43</span></div>`);
}

function fillAllStepBodies(ex){
  const prod=ex.products[0]||'未识别产品';
  const u=stepBy('u');if(u)u.body=typeStepBody();
  const p=stepBy('p');if(p)p.body=stepBody('s2',checkHtml([
    {k:'ok',t:'影响产品',d:prod},
    {k:PARSE.fields.geo.k==='ok'?'ok':'err',t:'Geo Impact',d:PARSE.fields.geo.d}
  ]));
  const f=stepBy('f');if(f)f.body=fillStep3Html();
  if(!PARSE.simCases||!PARSE.simCases.length) initSimData(!!PARSE.simDup);
  const sm=stepBy('sim');if(sm){sm.body=simStepBody();syncSimStepState(sm);}
  if(!PARSE.typeMeta) applyTypeMeta(effectiveType());
  const meta=PARSE.typeMeta;
  const n=(PARSE.simCases||[]).length;
  const v=stepBy('v');if(v)v.body=stepBody('s4',checkHtml([
    {k:'ok',t:'引用相似 PCR 检查',d:`已检索 ${n} 条参考（${meta.similarHint||'同类'}）`},
    {k:'ok',t:'比对历史实施周期',d:`同类平均 ${meta.leadDays} 天`},
    {k:'ok',t:'分析成本影响',d:'成本叙事与 Business Case 不一致'},
    {k:'ok',t:'汇总价值判断',d:'建议补充后再提'}
  ]));
  const sp=stepBy('split');if(sp) sp.body=splitBody();
  const s=stepBy('s');if(s) s.body=fillStep5Body();
}

function finishParse(ex){
  PARSE.animating=false;PARSE.skipped=true;
  if(!PARSE.fields) initParseFields(ex);
  if(!PARSE.typeMeta) applyTypeMeta(PARSE.typePick||'Hardware/SBB');
  if(!PARSE.simCases||!PARSE.simCases.length) initSimData(!!PARSE.simDup);
  if(!PARSE.steps.length){
    PARSE.split=/vPro/i.test(PARSE.text)&&/non-vPro/i.test(PARSE.text);
    const uDone=PARSE.typeConfirmed&&PARSE.pcrType;
    const n=(PARSE.simCases||[]).length;
    PARSE.steps=[
      {id:'u',title:'理解变更内容',st:uDone?'done':'pending',sum:uDone?PARSE.pcrType:'待确认',info:'s1',open:false,body:''},
      {id:'p',title:'识别影响产品',st:'done',sum:ex.products[0]||'未识别',info:'s2',open:false,body:''},
      {id:'f',title:'补全必填信息',st:'warn',sum:'',info:'s3',open:false,body:''},
      {id:'sim',title:'相似 PCR 检查',st:'pending',sum:n?('找到 '+n+' 条参考'):'待确认',info:'ssim',open:false,body:''},
      {id:'v',title:'可行性与价值评估',st:'done',sum:'建议补充后再提',info:'s4',open:false,body:''},
      {id:'s',title:'提交验证',st:'wait',sum:'待前置完成',info:'s5',open:false,body:'',pre:'需先补全必填信息'}
    ];
    if(PARSE.split) PARSE.steps.splice(3,0,{id:'split',title:'确认是否拆分为两条',st:'warn',sum:'AI 建议拆分',info:'s2',open:false,dyn:true});
  } else if(!stepBy('sim')){
    const fIdx=PARSE.steps.findIndex(s=>s.id==='f');
    const insertAt=fIdx>=0?fIdx+1+(PARSE.steps[fIdx+1]&&PARSE.steps[fIdx+1].id==='split'?1:0):3;
    const n=(PARSE.simCases||[]).length;
    PARSE.steps.splice(insertAt,0,{id:'sim',title:'相似 PCR 检查',st:'pending',sum:n?('找到 '+n+' 条参考'):'待确认',info:'ssim',open:false,body:''});
  }
  syncStepStates();
  collapseAllSteps();
  fillAllStepBodies(ex);
  renderPlist();
  PARSE._animateConclusion=true;
  renderConclusion();
}

function renderSubmitDockHtml(){
  if(PARSE.submitted){
    const no=PARSE.pcrNumber||'SP20260825_0002';
    const at=PARSE.submitAt||'';
    return `<div class="submit-dock" id="submitDock">
      <div class="sd-done">
        <div class="ok">✓ 已提交至 PACE · ${no}</div>
        <div class="meta">状态：Under Review</div>
        <div class="meta">提交时间：${at}</div>
      </div>
      <div class="pact">
        <button class="btn btn-ghost" type="button" onclick="viewInMyTasks()">在 My Tasks 中查看</button>
        <button class="btn-force" type="button" onclick="openWithdrawModal()">撤销提交</button>
      </div>
    </div>`;
  }
  return `<div class="submit-dock" id="submitDock">
    <div class="sd-note">提交后将在 <b>PACE</b> 中创建 PCR 记录，进入 <b>Review</b> 阶段，由 LM / Portfolio / Sponsor 审核。你将在「My Tasks」中跟踪后续状态。<span class="tipdot" onclick="showTip(event,'pcrPace',43)">43</span></div>
    <div class="pact">
      <button class="btn btn-ghost" type="button" onclick="savePcrDraft()">存草稿</button>
      <button class="btn btn-primary" type="button" onclick="openFillModal()">一键填写</button>
      <button class="btn-force" type="button" onclick="openPcrForce()">Force Submit</button>
      <span class="tipdot" onclick="showTip(event,'pcrForce',41)">41</span>
    </div>
  </div>`;
}

function defaultFillData(){
  const ex=extractFields(PARSE.text||'');
  const prod=ex.products[0]||'ThinkPad T14p Gen 5';
  const typ=PARSE.pcrType||PARSE.typePick||'Hardware/SBB';
  const geo=(PARSE.fields&&PARSE.fields.geo&&PARSE.fields.geo.val)||'PRC';
  const bc=(PARSE.fields&&PARSE.fields.bc&&PARSE.fields.bc.val)||'Marketing Request';
  const target=(PARSE.fields&&PARSE.fields.target&&PARSE.fields.target.val)||'2026-08-25';
  return {
    pcrNumber:'SP20260825_0002',
    pcrName:'Change X9 12Xe vPro (MS5) to X9 12Xe non-vPro (T6) on T14p',
    proposer:'test@lenovo.com',
    products:prod,
    pcrType:typ,
    bg:'Intel 已确认，Nova Lake 产品范围内将提供一款 X9 12Xe non-vPro 处理器。',
    reason:'与原规划的 X9 12Xe vPro（MS5）相比，新处理器：\n• 成本更低；\n• 性能保持一致。',
    request:'请在 CPU 清单中：\n• 移除原有的 X9 12Xe vPro（MS5）SKU；\n• 替换为 X9 12Xe non-vPro（T6）SKU。',
    impact:'本次替换：\n• 不增加 PCBA 总数量；\n• 不产生额外 NRE 费用。',
    createdOn:'2026-08-25 10:49:13',
    otm:'test@lenovo.com',
    sponsor:'test29@lenovo.com',
    pm:'test@lenovo.com',
    cpTeam:prod,
    category:'ThinkPad_Commercial',
    businessCase:bc,
    geo:geo,
    targetDate:target
  };
}
function getFillData(){return PARSE.fillSnapshot?JSON.parse(JSON.stringify(PARSE.fillSnapshot)):defaultFillData();}
function escHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function formatCrHtml(text){
  const lines=String(text||'').split(/\n/).map(l=>l.trim()).filter(Boolean);
  if(!lines.length) return '';
  const bullets=lines.filter(l=>/^•|^-/.test(l));
  const lead=lines.filter(l=>!/^•|^-/.test(l));
  let h=lead.map(l=>escHtml(l)).join('<br>');
  if(bullets.length) h+=(h?'<br>':'')+'<ul>'+bullets.map(l=>`<li>${escHtml(l.replace(/^[•\-]\s*/,''))}</li>`).join('')+'</ul>';
  return h;
}

function openFillModal(){
  if(PARSE.simDup&&!PARSE.simDupHandled){toast('存在完全重复的在途 PCR，请先处理');return;}
  PARSE.fillEditing=false;
  if(!PARSE.fillSnapshot) PARSE.fillSnapshot=defaultFillData();
  renderFillModal();
}
function renderFillModal(){
  const d=getFillData();
  const edit=PARSE.fillEditing;
  const body=edit?fillModalEditHtml(d):fillModalReadHtml(d);
  const foot=edit
    ? `<button class="btn btn-ghost" type="button" data-cancel-edit>取消修改</button>
       <button class="btn btn-primary" type="button" data-save-submit>保存并提交</button>`
    : `<button class="btn btn-ghost" type="button" data-draft>存草稿</button>
       <button class="btn btn-primary" type="button" data-submit>提交至 PACE</button>
       <button class="btn btn-teal-outline" type="button" data-edit>修改并提交</button>`;
  modalHost.innerHTML=`<div class="modal fill-modal" role="dialog" aria-modal="true">
    <div class="fm-h">
      <div class="fm-ico">✦</div>
      <div class="fm-titles"><h3>Confirm Content</h3><p>请确认以下信息，提交前可修改</p></div>
      <button type="button" class="fm-x" data-x title="关闭">×</button>
    </div>
    <div class="fm-b">${body}</div>
    <div class="fm-f">${foot}</div>
  </div>`;
  scrim.classList.add('show');
  const root=modalHost.querySelector('.fill-modal');
  root.querySelector('[data-x]').onclick=closeModal;
  const draftBtn=root.querySelector('[data-draft]');
  if(draftBtn) draftBtn.onclick=()=>savePcrDraft(true);
  const subBtn=root.querySelector('[data-submit]');
  if(subBtn) subBtn.onclick=()=>submitFromFill(false);
  const editBtn=root.querySelector('[data-edit]');
  if(editBtn) editBtn.onclick=()=>{PARSE.fillEditing=true;renderFillModal();};
  const cancelBtn=root.querySelector('[data-cancel-edit]');
  if(cancelBtn) cancelBtn.onclick=()=>{PARSE.fillEditing=false;renderFillModal();toast('已取消修改');};
  const saveBtn=root.querySelector('[data-save-submit]');
  if(saveBtn) saveBtn.onclick=()=>submitFromFill(true);
  if(PARSE._fillEsc) document.removeEventListener('keydown',PARSE._fillEsc);
  PARSE._fillEsc=e=>{if(e.key==='Escape') closeModal();};
  document.addEventListener('keydown',PARSE._fillEsc);
}
function fillModalReadHtml(d){
  return `<div class="fm-sec"><div class="fm-sec-t">基础信息</div>
    <div class="fill-grid-box"><table class="fill-grid fill-grid-2">
      <tr><td class="fk">PCR Number</td><td class="fv">${escHtml(d.pcrNumber)}</td><td class="fk">PCR Name</td><td class="fv">${escHtml(d.pcrName)}</td></tr>
      <tr><td class="fk">Proposer</td><td class="fv">${escHtml(d.proposer)}</td><td class="fk">Impacted Products</td><td class="fv">${escHtml(d.products)}</td></tr>
      <tr><td class="fk">PCR Type</td><td class="fv" colspan="3">${escHtml(d.pcrType)}</td></tr>
    </table></div></div>
    <div class="fm-sec"><div class="fm-sec-t">Change Request</div>
    <div class="fill-cr"><table>
      <tr><td class="crk">背景</td><td class="crv">${formatCrHtml(d.bg)}</td></tr>
      <tr><td class="crk">变更原因</td><td class="crv">${formatCrHtml(d.reason)}</td></tr>
      <tr><td class="crk">变更请求</td><td class="crv">${formatCrHtml(d.request)}</td></tr>
      <tr><td class="crk">影响说明</td><td class="crv">${formatCrHtml(d.impact)}</td></tr>
    </table></div></div>
    <div class="fm-sec"><div class="fm-sec-t">其他信息</div>
    <div class="fill-grid-box"><table class="fill-grid fill-grid-3">
      <tr><td class="fk">Created On</td><td class="fv">${escHtml(d.createdOn)}</td><td class="fk">OTM</td><td class="fv">${escHtml(d.otm)}</td><td class="fk">Sponsor</td><td class="fv">${escHtml(d.sponsor)}</td></tr>
      <tr><td class="fk">Product Manager</td><td class="fv">${escHtml(d.pm)}</td><td class="fk">CP Team</td><td class="fv">${escHtml(d.cpTeam)}</td><td class="fk">Product Category</td><td class="fv">${escHtml(d.category)}</td></tr>
      <tr><td class="fk">Business Case Reason</td><td class="fv">${escHtml(d.businessCase)}</td><td class="fk">Geo Impact</td><td class="fv">${escHtml(d.geo)}</td><td class="fk">Target Implementation Date</td><td class="fv">${escHtml(d.targetDate)}</td></tr>
    </table></div></div>`;
}
function fillModalEditHtml(d){
  const types=PCR_TYPES.map(t=>`<option value="${t}" ${t===d.pcrType?'selected':''}>${t}</option>`).join('');
  const bcs=['Marketing Request','Cost Saving','Quality','Customer Request','Other'].map(t=>`<option value="${t}" ${t===d.businessCase?'selected':''}>${t}</option>`).join('');
  const geos=['PRC','WW','EMEA','NA','LA','AP'].map(t=>`<option value="${t}" ${t===d.geo?'selected':''}>${t}</option>`).join('');
  return `<div class="fm-sec"><div class="fm-sec-t">基础信息</div>
    <div class="fill-grid-box"><table class="fill-grid fill-grid-2">
      <tr><td class="fk">PCR Number</td><td class="fv"><input data-f="pcrNumber" value="${escHtml(d.pcrNumber)}"></td>
          <td class="fk">PCR Name</td><td class="fv"><input data-f="pcrName" value="${escHtml(d.pcrName)}"></td></tr>
      <tr><td class="fk">Proposer</td><td class="fv"><input data-f="proposer" value="${escHtml(d.proposer)}"></td>
          <td class="fk">Impacted Products</td><td class="fv"><input data-f="products" value="${escHtml(d.products)}"></td></tr>
      <tr><td class="fk">PCR Type</td><td class="fv" colspan="3"><select data-f="pcrType">${types}</select></td></tr>
    </table></div></div>
    <div class="fm-sec"><div class="fm-sec-t">Change Request</div>
    <div class="fill-cr"><table>
      <tr><td class="crk">背景</td><td class="crv"><textarea data-f="bg">${escHtml(d.bg)}</textarea></td></tr>
      <tr><td class="crk">变更原因</td><td class="crv"><textarea data-f="reason">${escHtml(d.reason)}</textarea></td></tr>
      <tr><td class="crk">变更请求</td><td class="crv"><textarea data-f="request">${escHtml(d.request)}</textarea></td></tr>
      <tr><td class="crk">影响说明</td><td class="crv"><textarea data-f="impact">${escHtml(d.impact)}</textarea></td></tr>
    </table></div></div>
    <div class="fm-sec"><div class="fm-sec-t">其他信息</div>
    <div class="fill-grid-box"><table class="fill-grid fill-grid-3">
      <tr><td class="fk">Created On</td><td class="fv"><input data-f="createdOn" value="${escHtml(d.createdOn)}"></td>
          <td class="fk">OTM</td><td class="fv"><input data-f="otm" value="${escHtml(d.otm)}"></td>
          <td class="fk">Sponsor</td><td class="fv"><input data-f="sponsor" value="${escHtml(d.sponsor)}"></td></tr>
      <tr><td class="fk">Product Manager</td><td class="fv"><input data-f="pm" value="${escHtml(d.pm)}"></td>
          <td class="fk">CP Team</td><td class="fv"><input data-f="cpTeam" value="${escHtml(d.cpTeam)}"></td>
          <td class="fk">Product Category</td><td class="fv"><input data-f="category" value="${escHtml(d.category)}"></td></tr>
      <tr><td class="fk">Business Case Reason</td><td class="fv"><select data-f="businessCase">${bcs}</select></td>
          <td class="fk">Geo Impact</td><td class="fv"><select data-f="geo">${geos}</select></td>
          <td class="fk">Target Implementation Date</td><td class="fv"><input type="date" data-f="targetDate" value="${escHtml(String(d.targetDate||'').slice(0,10))}"></td></tr>
    </table></div></div>`;
}
function collectFillForm(){
  const root=modalHost.querySelector('.fill-modal');
  if(!root) return getFillData();
  const d=getFillData();
  root.querySelectorAll('[data-f]').forEach(el=>{d[el.getAttribute('data-f')]=el.value;});
  return d;
}
function savePcrDraft(fromModal){
  if(fromModal&&PARSE.fillEditing) PARSE.fillSnapshot=collectFillForm();
  else if(fromModal) PARSE.fillSnapshot=getFillData();
  else if(!PARSE.fillSnapshot) PARSE.fillSnapshot=defaultFillData();
  PARSE.histMark='draft';
  PARSE.submitted=false;
  updateParseHistMark();
  closeModal();
  renderConclusion();
  toast('草稿已保存');
}
function submitFromFill(fromEdit){
  if(PARSE.simDup&&!PARSE.simDupHandled){toast('存在完全重复的在途 PCR，不可提交');return;}
  let d=fromEdit?collectFillForm():getFillData();
  if(fromEdit){
    const prev=PARSE.fillSnapshot||defaultFillData();
    if(d.pcrType!==prev.pcrType||d.targetDate!==prev.targetDate){
      toast('已修改关键字段（Type / 目标日），请确认后提交');
    }
  }
  PARSE.fillSnapshot=d;
  PARSE.pcrNumber=d.pcrNumber||'SP20260825_0002';
  PARSE.submitAt=new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).replace(/\//g,'-');
  PARSE.submitted=true;
  PARSE.histMark='submitted';
  PARSE.fillEditing=false;
  if(PARSE.fields){
    if(d.geo){PARSE.fields.geo.val=d.geo;PARSE.fields.geo.k='ok';PARSE.fields.geo.d=d.geo;}
    if(d.businessCase){PARSE.fields.bc.val=d.businessCase;PARSE.fields.bc.k='ok';PARSE.fields.bc.d=d.businessCase;}
    if(d.targetDate){PARSE.fields.target.val=d.targetDate;PARSE.fields.target.k='ok';PARSE.fields.target.d=d.targetDate;}
  }
  if(d.pcrType){PARSE.pcrType=d.pcrType;PARSE.typeConfirmed=true;PARSE.typePick=d.pcrType;}
  updateParseHistMark();
  closeModal();
  renderConclusion();
  toast('已提交至 PACE · '+PARSE.pcrNumber);
}
function viewInMyTasks(){
  switchView('task');
  toast('已切换到 My Tasks');
}
function openWithdrawModal(){
  modalHost.innerHTML=`<div class="modal"><div class="modal-h"><h3>撤销提交？</h3>
    <p>PCR ${PARSE.pcrNumber||''} 将从 Review 流程中撤回，状态回退为 Draft，已通知的审核人将收到撤回通知。</p></div>
    <div class="modal-b">
      <div class="modal-note" style="color:var(--amber);margin:0 0 10px">⚠ 若已有审核人开始处理，撤销可能失败。</div>
      <label style="font-size:12.5px;font-weight:600;color:var(--ink)">撤销原因（必填）</label>
      <textarea class="reason" id="withdrawReason" placeholder="请说明撤销原因…"></textarea>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" data-x>取消</button>
      <button class="btn btn-primary" data-ok disabled>确认撤销</button>
    </div></div>`;
  scrim.classList.add('show');
  const ta=modalHost.querySelector('#withdrawReason');
  const ok=modalHost.querySelector('[data-ok]');
  modalHost.querySelector('[data-x]').onclick=closeModal;
  ta.oninput=()=>{ok.disabled=!ta.value.trim();};
  ok.onclick=()=>{
    const r=ta.value.trim();if(!r)return;
    PARSE.withdrawLog={by:'test@lenovo.com',at:new Date().toISOString(),reason:r,pcr:PARSE.pcrNumber};
    PARSE.submitted=false;PARSE.histMark='withdrawn';
    updateParseHistMark();
    closeModal();
    renderConclusion();
    toast('流程已撤回，状态回退为 Draft');
  };
}

function submitPcr(){
  /* 兼容旧调用：改为打开一键填写弹窗 */
  openFillModal();
}
function openPcrForce(){
  modalHost.innerHTML=`<div class="modal"><div class="modal-h"><h3>Force Submit</h3><p>存在警告项时的强制提交，需填写理由并留痕</p></div>
    <div class="modal-b"><textarea class="reason" id="pcrForceReason" placeholder="说明为何绕过校验项…"></textarea>
    <div class="modal-note">理由与被绕过的校验项将对 OTM 可见。硬性合规项不可绕过。<span class="tipdot" onclick="showTip(event,'pcrForce',41)">41</span></div></div>
    <div class="modal-f"><button class="btn btn-ghost" data-x>取消</button><button class="btn btn-primary" data-ok>确认强制提交</button></div></div>`;
  scrim.classList.add('show');
  modalHost.querySelector('[data-x]').onclick=closeModal;
  modalHost.querySelector('[data-ok]').onclick=()=>{
    const r=(document.getElementById('pcrForceReason').value||'').trim();
    if(!r){toast('请填写强制提交理由');return;}
    PARSE.forceReason=r;PARSE.forceAt=new Date().toISOString();
    closeModal();toast('已 Force Submit · 理由已留痕');exitParseMode();
  };
}

plusInit();
window.PARSE=PARSE;window.extractFields=extractFields;window.startParse=startParse;window.skipParse=skipParse;
window.DEMO_MAIL=DEMO_MAIL;window.TIPS_HOME=TIPS_HOME;window.tipNum=tipNum;window.togglePlistMini=togglePlistMini;
window.enterParseMode=enterParseMode;window.exitParseMode=exitParseMode;window.resumeParse=resumeParse;
window.suspendParse=suspendParse;window.newChatSession=newChatSession;window.backToOverview=backToOverview;
window.renderPlist=renderPlist;window.openPcrForce=openPcrForce;window.resolveIssue=resolveIssue;window.decideSplit=decideSplit;
window.mustAllOk=mustAllOk;window.refreshParseUI=refreshParseUI;window.clickStep=clickStep;
window.toggleIssue=toggleIssue;window.toggleAllIssues=toggleAllIssues;window.toggleThink=toggleThink;window.toggleAllSteps=toggleAllSteps;
window.confirmPcrType=confirmPcrType;window.selectTypeOpt=selectTypeOpt;window.openTypePicker=openTypePicker;
window.toggleTypeMapDetail=toggleTypeMapDetail;
window.confirmSimRef=confirmSimRef;window.toggleSimRef=toggleSimRef;window.toggleSimCompare=toggleSimCompare;
window.setSimDuplicate=setSimDuplicate;window.explainSimDiff=explainSimDiff;window.viewDupPcr=viewDupPcr;
window.openFillModal=openFillModal;window.savePcrDraft=savePcrDraft;window.submitFromFill=submitFromFill;
window.openWithdrawModal=openWithdrawModal;window.viewInMyTasks=viewInMyTasks;window.closeModal=closeModal;
window.submitPcr=submitPcr;

window.Overview = {
  startParse: typeof startParse === 'function' ? startParse : null,
  resumeParse: typeof resumeParse === 'function' ? resumeParse : null,
  suspendParse: typeof suspendParse === 'function' ? suspendParse : null
};
