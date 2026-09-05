/* shell: navigation, tips, mode, shared chrome */
const TIPS_TASK={
 rail:{t:'左侧任务导航：按 PACE 主流程组织',
   ix:'覆盖 Review、OTM Screen、Vote、Evaluation、OTM Assessment、Work Item 等任务类型，可按类型筛选。单击任务直接进入执行态，不需再点「执行」。',
   fn:'可按角色隐藏无权限的任务类型，但不能把现有主流程任务合并成无法映射到 PACE 的抽象任务。切换任务时须保持任务边界，避免不同 PCR、CP Root/Branch 的输入与证据混淆。',
   ref:['P-01 任务即入口','P-04 按 PACE 主流程组织']},
 badge:{t:'任务状态标识',
   ix:'每条任务显示 PCR 状态、任务类型、Mandatory/Critical 标记与到期时间，逾期以红色标出。',
   fn:'必须明确区分「PCR 状态、Task Name、处理动作」三类概念，不可混为一谈。Mandatory 与 Critical 影响后续阻断规则。',
   ref:['P-04','FR-07']},
 agent:{t:'Agent 引导区',
   ix:'进入任务后 Agent 先说明它做了什么、结论是什么，而非等待用户提问。复杂意图澄清与内容生成优先通过对话完成。',
   fn:'对话优先但不对话至上：明确的决策动作（Agree/Disagree、批量操作、高风险提交）仍使用结构化控件。',
   ref:['P-02 对话优先但不对话至上']},
 draft:{t:'AI Comment 草稿',
   ix:'支持手工编写与 AI 生成。AI 结果只作为草稿，可接受、编辑、重新生成或放弃，未经确认不会写回。',
   fn:'AI 生成的 Comment、Vote 建议及 Follow-up Action 必须先以草稿形式呈现。这是人在回路的核心体现。',
   ref:['P-05 人在回路','FR-07']},
 vote:{t:'Vote 立场选择',
   ix:'使用明确控件选择 PACE 已配置选项（Agree / Disagree / No Impact），而非让 AI 代选。',
   fn:'若为部分产品范围（Partial Scope），必须逐产品表达，不得只给整单结论。实际选项与各 BU 差异为上线前必须澄清项。',
   ref:['FR-07','待确认：Partial Scope 规则']},
 valid:{t:'提交前校验',
   ix:'按 Task Type、PCR Type × Function 规则检查格式、完整性、Risk、Impact、Cost、Schedule 与 Evidence。',
   fn:'校验状态须区分「通过、警告、阻断性错误、无法判断」四类。历史 Comment 覆盖率低时必须显示样本覆盖不足，不能把「无评论」解释为「无风险」。',
   ref:['FR-07','FR-10 覆盖度提示']},
 force:{t:'Force Submit 受控例外',
   ix:'仅在存在警告或允许绕过的校验项时可用，需填写强制提交理由才能提交。',
   fn:'不是普通提交选项，不得绕过硬性合规或数据完整性阻断。系统记录被绕过的校验项、提交人、时间与任务标识，并在 OTM Review 中明确标识。',
   ref:['7.5 Force Submit 例外控制']},
 otm:{t:'OTM 评估汇总',
   ix:'按 PCR Type 模板汇总 Vote、Evaluation、Cost、产品范围、风险与未决项，明确 Mandatory 完成度与意见冲突。',
   fn:'须区分事实、AI 推断、历史参考与待人工确认事项，并链接到来源任务或 Comment。',
   ref:['FR-11 OTM 评估结论汇总']},
 path:{t:'处理路径由 OTM 决定',
   ix:'AI 解释每条路径的条件与后果，但不自动点击、不替代决策。Approve with Work Item 前需校验至少存在一个有效 Work Item。',
   fn:'路径须对齐 PACE 可用动作：Approve with Work Item、Approve to Close、Quick Return、Return、Pending/Resume、Solution Proposed、Condition Approve。',
   ref:['FR-11','待确认：与 PACE 状态机核对']},
 wi:{t:'Work Item 草稿',
   ix:'从已确认结论生成草稿，字段含 Task Description、Function Team、Owner、Target Date、影响产品、来源 Comment 与验收证据。',
   fn:'Owner 依 Team/Function 配置与权限确定；日期依 Lead Time、目标实施日、依赖与工作日历推算，不得由模型自由猜测。OTM 确认后才在 PACE 创建。',
   ref:['FR-12 Work Item 推荐']},
 ctx:{t:'右侧上下文与证据区',
   ix:'PCR 详情默认展开，进入 Comment 编辑时可自动折叠以释放空间，用户可随时重新展开。',
   fn:'关键字段、附件或 Reference 读取失败时必须明确提示缺失项，不得将不完整信息包装为完整上下文。',
   ref:['7.3 PCR 上下文呈现规则']},
 sim:{t:'相似 PCR 检索',
   ix:'展示 Top 3 相似案例与相似度，标注相似点与关键差异，由用户判断是否真正可比。',
   fn:'相似度须综合产品、PCR Type、变更对象、变更动作、功能域与时间，禁止仅因产品名称相同直接类比。历史数据未证明 Closed 等于方案成功。',
   ref:['FR-09','FR-05 重复检查']},
 tevi:{t:'AI 证据可追溯',
   ix:'每条 AI 建议与具体证据一一对应，可点击回溯原始记录。',
   fn:'展示可验证的推荐理由、证据摘要与不确定性，不展示模型内部逐步推理过程。',
   ref:['P-06 可解释可追溯']},
 write:{t:'写回 PACE 前必须确认',
   ix:'点击主操作弹出确认框，列示将写回的内容、目标系统与操作人。写回后返回成功、失败或部分失败状态。',
   fn:'所有向 PACE 或目标系统的写回都必须经用户明确确认。失败时保留用户输入、证据版本与重试信息，不丢失已填内容。',
   ref:['P-05 人在回路','7.4 写回规则']},
};


/* ══════════ 原型讨论模式：TIP 数据 ══════════ */
const TIPS_HOME={
 nav:{t:'左侧导航：轻量四入口',
   ix:'「新会话」置顶为最高频动作。四个导航项常驻，带数字角标（我的任务 3、执行管理 2），无需进入即可知道哪里有事。当前项以主色底标识。',
   fn:'四入口分工：我的任务=处理一条；统计分析=看全盘；执行管理=盯落地；总览=入口与摘要层。角标数字随数据实时变化。',
   ref:['导航结构待业务确认命名']},
 hist:{t:'会话历史与钉住',
   ix:'历史按今天/昨天/更早分组，点击可回溯并续聊。「已钉到首页」是把某次分析结果固化为常驻卡片。',
   fn:'用对话替代传统的「新建视图→配置图表→保存」，让用户以最少操作自定义面板。会话是过程，钉住的是结果，两者分区显示。',
   ref:['AI 原生交互','少按钮原则']},
 brief:{t:'AI 判断段：助手而非简报',
   ix:'数据更新自动触发重算，右上角显示数据时点。页面停留时若结论变化，内容平静更新，不弹「点击刷新」。',
   fn:'OTM 全局视角：第一句说的是全盘风险，不是个人待办。三条判断按严重度排序，每条都指向一个待决策事项。',
   ref:['助手式实时计算','OTM 全局视角']},
 evi:{t:'AI 建议可追溯',
   ix:'点击「依据 N 条证据」就地展开，不跳页。每条证据标注来源类型（Evaluation / Target Date / Similar PCR）并可回溯原始记录。',
   fn:'展示可验证的推荐理由与证据摘要，不展示模型内部推理过程。这是首页信任的基础——结论一旦不可验证，整个面板就失去价值。',
   ref:['P-06 可解释可追溯','FR-09 / FR-10']},
 ent:{t:'文中实体即导航',
   ix:'判断段和变化流里带下划线的实体（PCR、项目）可点击。点击不跳页，而是就地设为当前话题并展开其上下文。',
   fn:'消灭大量按钮与页面跳转的关键手段：用户读到哪、就能从哪进入下一步，不需要回到列表再查找。',
   ref:['P-03 单页面完成','少按钮原则']},
 kpi:{t:'KPI 带：管理者全局盘子',
   ix:'每个指标带环比方向（▲红/▼绿/●持平）。点击任一指标就地展开对应明细并附 AI 归因，而非跳转到独立报表页。',
   fn:'过渡期设计取中间值：结构用传统面板（信息密度、熟悉布局），交互用 AI（可追问、带归因）。不用 AI 的人当普通面板用即可。',
   ref:['过渡期中间值']},
 mods:{t:'模块入口卡片',
   ix:'与左侧导航双路径并存：左栏随时可切换，首页卡片给新用户更明确的功能说明与当前负载提示。',
   fn:'卡片上的标签显示实时状态（待决策 3、风险 2），让入口本身携带信息，而不只是一个跳转按钮。',
   ref:['参考图风格']},
 watch:{t:'我关注的 PCR：关注来源',
   ix:'两类来源：自动（我是 OTM、我投过票、我是 Work Item Owner）与手动订阅（点一次星）。自动那批无需任何操作即出现。',
   fn:'默认按「需要注意的程度」排序，红的、卡住的、待决策的自动浮上来，不按编号或时间排。首次登录时 AI 主动完成订阅，避免空面板。',
   ref:['要求1：关注的PCR进展','空状态设计']},
 signals:{t:'每行只给三个信号',
   ix:'进度（Work Item 完成率）、风险（数量+最高等级）、成本（相对评估基线的偏差方向）。一行扫过去即可判断是否点入。',
   fn:'刻意不堆字段。传统列表会展示十几列，这里只留决策所需的三个维度，其余在展开面板中呈现。',
   ref:['信息密度取舍']},
 cost:{t:'成本可见性受权限约束',
   ix:'首页仅显示偏差方向与幅度（▲+2.1% / ●持平），具体金额需权限才能展开。无权限显示「—」而非空白。',
   fn:'成本继承 PACE 角色与用户组权限，不得因 AI 汇总扩大可见范围。显示「—」而非空白是刻意的：空白会被误读为「没有成本影响」。',
   ref:['FR-08 成本权限','复核结论：成本能力']},
 inline:{t:'就地展开处理面板',
   ix:'点击关注列表任意一行，在首页原地展开处理面板，不跳页。处理完收起继续看全局。「完整视图」按钮通向对应模块，供连续批量处理场景使用。',
   fn:'解决管理者「边看全局边顺手处理」的场景，避免首页与任务页之间来回切换。同时保留独立任务页，两条路径并存。',
   ref:['P-01 任务即入口','P-03 单页面完成']},
 paths:{t:'处理路径需人工决策',
   ix:'必须先选择一条路径，「确认决策」按钮才可用。AI 只解释每条路径的条件与后果，不自动选择、不代替点击。',
   fn:'处理路径须与 PACE 实际状态机一一对应（Approve with Work Item / Approve to Close / Return / Pending 等），此为上线前必须澄清项。',
   ref:['P-05 人在回路','FR-11 OTM 汇总']},
 writeback:{t:'写回前必须确认',
   ix:'所有 AI 产出先以草稿呈现，向 PACE 写回前必须经用户明确确认。Work Item 需 OTM 审阅编辑后才正式分发。',
   fn:'AI 提供建议、校验与证据，不替代业务用户做最终决策。这是整个产品的核心边界。',
   ref:['P-05 人在回路','FR-12 Work Item']},
 health:{t:'执行健康度：ODM 阶段',
   ix:'按健康度分三档，点击进入对应项目清单。下方 AI 归因说明风险的共性根因，而非罗列个例。',
   fn:'ODM 执行阶段作为独立小项目管理：进度、里程碑、风险登记册、Work Item 四位一体。ODM 方另有极简填报门户，与本界面权限分离。',
   ref:['要求2：ODM小项目','FR-13/14 下发与回写']},
 load:{t:'职能负载',
   ix:'显示各职能 Vote/Evaluation 积压量，最高者标红。点击可下钻到该职能的具体任务清单。',
   fn:'管理者视角特有内容——AI 摘要擅长挑出三件事，不擅长让你把全局扫一遍。这类分布数据必须以传统图表形式给足。',
   ref:['管理者信息密度']},
 matrix:{t:'产品 × 阶段矩阵',
   ix:'行为产品线、列为生命周期阶段、格子为数量，颜色深浅表示密集度，红色格表示含逾期。点击单元格就地展开该组 PCR 明细。',
   fn:'产品维度的核心视图：一个机型身上同时压着几条变更、堆在哪个阶段、有没有撞期。项目维度为另一轴，可在统计分析中切换。',
   ref:['要求1：产品/项目维度统计']},
 dim:{t:'三个维度互不重叠',
   ix:'产品＝一个机型被多条 PCR 压着（反向索引）；项目＝跨多条 PCR 的交付目标；CP/SP＝单条 PCR 的内部结构，不是项目。',
   fn:'项目归属为可选，因此统计必须保留「未归属项目」这一常态桶。CP 有 root+branch 但不等于项目，一个项目内可同时含 CP 与 SP。',
   ref:['维度定义已确认','待确认：项目归属字段']},
 feed:{t:'变化流：只推变化不推状态',
   ix:'三条规则：只推变化（「逾期转红」是，「目前逾期」不是）；同类聚合（5条同因亮红合成1条）；可标记已读与静音。',
   fn:'小圆点表示未读。来源包括 Vote 落地、Work Item 回写、成本变更、任务逾期、项目成员变动。做不好就是噪音，聚合规则是关键。',
   ref:['要求2：变化与information']},
 ask:{t:'对话替代筛选器',
   ix:'直接输入即新建会话，回车发送。建议 chip 提供引导。传统筛选器（顶部时间/BU）同时保留，不强迫任何人使用对话。',
   fn:'过渡期的核心策略：AI 能力是加在传统之上，而非替代传统。愿意用对话的人省掉翻找，不用的人完全不受影响。',
   ref:['过渡期中间值','少按钮原则']},
 mode:{t:'原型模式切换',
   ix:'讨论模式显示全部 TIP 标记，用于内部评审与需求对齐；演示模式隐藏全部标记，用于业务确认会演示。',
   fn:'同一份原型应对两种场合：业务确认会需要干净界面让人专注体验，内部评审需要解释每个设计点的依据与交互逻辑。',
   ref:['原型使用方式']},
 pcrEntry:{t:'四条创建入口的分工',
   ix:'`+` 菜单是创建主入口；回形针是高频上传的一层入口；粘贴长文本/邮件会浮出识别条；聚焦输入框弹出引导面板。',
   fn:'创建 PCR 不新增导航或页面，全部从首页对话完成。上传不藏在第二层，避免高频动作多点一次。',
   ref:['少按钮原则','P-03 单页面完成']},
 pcrGuide:{t:'引导面板只分写入与读取',
   ix:'聚焦后浮出两组：提交变更需求（写入）与提问与分析（读取）。打字时按关键词过滤条目，而不是把面板关掉。',
   fn:'分组界线是「写入 vs 读取」，不再拆查询/分析。失焦或选中某条后收起。',
   ref:['过渡期中间值']},
 pcrFold:{t:'返回总览不丢会话',
   ix:'点击顶部「← 总览」回到首页看板；左侧「进行中」会话仍保留，再点即可回到提交 PCR。',
   fn:'管理者需要随时对照全盘数字。返回总览是挂起而非删除，避免觉得进了另一个系统又找不回来。',
   ref:['P-03 单页面完成']},
 pcrList:{t:'进度清单钉在对话上方',
   ix:'五步清单 sticky 固定，不随对话滚动。补充信息时清单始终在视野内，核对结果能立刻看见。',
   fn:'管理者一边补字段一边看规则反馈。钉住避免滚回对话顶部找进度。',
   ref:['人在回路','P-03 单页面完成']},
 pcrRules:{t:'规则在执行时可见',
   ix:'当前步骤自动展开，显示正在使用的规则与逐条核对结果，而不是只藏在 ⓘ 后面。',
   fn:'用户很少主动点 ⓘ。规则最有说服力的时刻是 AI 正在用它的那一刻。ⓘ 改为完整规则说明书。',
   ref:['P-06 可解释可追溯']},
 pcrDyn:{t:'步骤可动态插入',
   ix:'AI 发现应拆分为两条 PCR 等特殊问题时，清单中临时插入带感叹号的待办步骤。',
   fn:'问题变成必须处理的待办，而不是淹没在对话流里。点击未开始步骤会提示前置条件。',
   ref:['待业务确认：拆分规则']},
 pcrForce:{t:'强制提交是受控例外',
   ix:'存在警告项时可强制提交，必须填写理由；理由与被绕过的校验项留痕并对 OTM 可见。硬性合规项不可绕过。',
   fn:'Force Submit 不是普通提交。绕过项、提交人、时间写入记录。',
   ref:['7.5 Force Submit 例外控制']},
 pcrCount:{t:'完善度用计数而不是百分比',
   ix:'清单头部显示「2/5 已完成」，步骤内区分必须补充与建议补充的条数，进度条只作辅助。',
   fn:'百分比会诱导凑数字。计数能分清必须项（阻断）与建议项（不阻断）。必须项全部通过即可提交。',
   ref:['待业务确认：必填规则']},
 pcrPace:{t:'提交目标必须明示',
   ix:'提交验证步骤明确告知：将在 PACE 中创建 PCR，进入 Review，由 LM / Portfolio / Sponsor 审核，随后可在 My Tasks 跟踪。',
   fn:'避免用户以为提交只发生在本工具内部。写回目标系统必须可见。',
   ref:['P-05 人在回路','7.4 写回规则']},
 pcrTypeConfirm:{t:'AI 只推荐不自动更改 Type',
   ix:'AI 给出候选与依据，用户确认前类型不生效；步骤显示「待确认 ◇」，不是 ✓。',
   fn:'PCR Type 决定模板、必填项与审批路径，定错则整条 PCR 皆错，因此必须人工确认。',
   ref:['PCR-SUB-003','P-05 人在回路']},
 pcrTypeCandidates:{t:'为何给两个候选而非一个',
   ix:'候选列表至少 2 项，各带依据与置信度；默认选中置信度最高项。',
   fn:'单一答案会让用户失去判断意识，两个候选促使用户主动比较。',
   ref:['PCR-SUB-003']},
 pcrTypeRerun:{t:'Type 切换后需重跑校验',
   ix:'确认后第 3 步及之后重置重跑，相似 PCR、可行性评估与必填划分随 Type 重算。',
   fn:'必填项、相似案例、历史周期均按 Type 划分，不重跑会导致校验结果与实际类型不符。',
   ref:['PCR-SUB-003','待业务确认']},
 pcrSimDupVsSim:{t:'Duplicate 与 Similar 的区别',
   ix:'上半部分是阻断判断（有没有一模一样的在途 PCR），下半部分是决策支持（历史上类似怎么做），用分隔线区分。',
   fn:'前者回答「能不能提」，后者回答「怎么提更好」，是两件不同的事。',
   ref:['PCR-SUB-007']},
 pcrSimReturn:{t:'被 Return 的案例为何最有价值',
   ix:'突出显示退回次数、原因，并给出本次可操作建议，而不只罗列历史失败。',
   fn:'成功案例只说明可行，失败案例才说明陷阱在哪；要告诉用户现在该做什么。',
   ref:['PCR-SUB-007']},
 pcrSimClosed:{t:'Closed 不等于方案成功',
   ix:'底部固定显示可比性判断提示：相似度多维度计算，Closed 只说明走完流程。',
   fn:'禁止仅因产品名称相同就类比；关闭不代表方案最优。',
   ref:['PCR-SUB-007','AI 边界约束']},
};

/* ══════════ 模式切换 ══════════ */
let mode='demo';
function setMode(m){
  mode=m;
  document.body.classList.toggle('discuss',m==='discuss');
  document.getElementById('mDisc').classList.toggle('on',m==='discuss');
  document.getElementById('mDemo').classList.toggle('on',m==='demo');
  document.getElementById('umhint').textContent = m==='discuss'
    ? '讨论模式：页面显示说明标记，点击可记录结论'
    : '演示模式：已隐藏全部说明标记';
  hideTip();
  if(m==='demo')closeList();
  toast(m==='discuss'?'已切换为讨论模式':'已切换为演示模式');
}

/* 用户菜单开关 */
function toggleMenu(e){
  e.stopPropagation();
  document.getElementById('umenu').classList.toggle('show');
}
function closeMenu(){document.getElementById('umenu').classList.remove('show');}
document.addEventListener('click',e=>{
  if(!e.target.closest('.usermenu'))closeMenu();
});

/* ══════════ 讨论结论：本地存储 ══════════ */
let VIEW='home';
const LSKS={home:'pcr_home_notes_v1',task:'pcr_task_notes_v1'};
let ALL={home:{},task:{}};
Object.keys(LSKS).forEach(v=>{try{ALL[v]=JSON.parse(localStorage.getItem(LSKS[v])||'{}');}catch(e){ALL[v]={};}});
let NOTES=ALL.home, TIPS=TIPS_HOME;

const ST={pending:'待确认',agreed:'已确认',open:'有争议'};
function saveNotes(){
  ALL[VIEW]=NOTES;
  try{localStorage.setItem(LSKS[VIEW],JSON.stringify(NOTES));}
  catch(e){toast('本地存储不可用，请用「导出」保存');}
  paintDots();
}
function toggleRail(){
  document.body.classList.toggle('railoff');
  railManual=true;
  syncRailTip();
}
function syncRailTip(){
  const btn=document.querySelector('.app > .rail .railtoggle');
  if(btn) btn.title=document.body.classList.contains('railoff')?'Expand sidebar':'Collapse sidebar';
}
let railManual=false;
function switchView(v){
  // 离开解析页时仅挂起会话（保留左侧「进行中」），不销毁，便于点历史回来
  if(typeof PARSE!=='undefined' && PARSE.active){
    if(v==='home'){
      suspendParse();
      if(VIEW===v){document.querySelector('.scroll').scrollTop=0;closeMenu();return;}
    }else{
      suspendParse();
    }
  }
  if(VIEW===v){closeMenu();return;}
  VIEW=v; NOTES=ALL[v]; TIPS=(v==='home'?TIPS_HOME:TIPS_TASK);
  document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('on',el.dataset.view===v));
  document.getElementById('view-home').style.display = v==='home'?'':'none';
  document.getElementById('view-task').style.display = v==='task'?'':'none';
  document.getElementById('crumb').textContent = v==='home'?'Overview':'My Tasks';
  if(v==='task'){ if(window.MyTasks&&MyTasks.ensureInit) MyTasks.ensureInit(); else if(!window.__taskInit){window.__taskInit=1;renderTaskAll();} }
  document.body.classList.toggle('taskview', v==='task');
  syncRailTip();
  const ask=document.getElementById('askwrap');
  if(ask)ask.style.display=(v==='home'?'':'none');
  hideTip();closeList();closeMenu();
  document.querySelector('.scroll').scrollTop=0;
  paintDots();
}
function paintDots(){
  document.querySelectorAll('.tipdot').forEach(d=>{
    const k=(d.getAttribute('onclick')||'').match(/'(\w+)'/);
    if(k)d.classList.toggle('noted',!!(NOTES[k[1]]&&NOTES[k[1]].txt));
  });
  const n=Object.values(NOTES).filter(x=>x&&x.txt).length;
  const el=document.getElementById('ncnt');
  if(el)el.textContent=n?`已记录 ${n} 条结论`:'已记录 0 条';
  if(document.getElementById('listp')&&document.getElementById('listp').classList.contains('show'))renderList();
}

function setSt(k,s){
  NOTES[k]=NOTES[k]||{txt:'',st:'pending'};
  NOTES[k].st=s;saveNotes();
  document.querySelectorAll('.stchips button').forEach(b=>b.classList.toggle('on',b.dataset.s===s));
}
function saveConc(k){
  const ta=document.getElementById('concta');if(!ta)return;
  const v=ta.value.trim();
  if(!v){delete NOTES[k];}
  else{NOTES[k]=NOTES[k]||{st:'pending'};NOTES[k].txt=v;
       NOTES[k].at=new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}
  saveNotes();
  const s=document.getElementById('savedtag');
  if(s){s.classList.add('show');setTimeout(()=>s.classList.remove('show'),1600);}
}
function delConc(k){
  if(!NOTES[k])return;
  delete NOTES[k];saveNotes();
  const ta=document.getElementById('concta');if(ta)ta.value='';
  toast('已删除该条结论');
}

/* ══════════ 导出 / 导入 ══════════ */
function dl(name,content,type){
  const b=new Blob([content],{type:type+';charset=utf-8'});
  const u=URL.createObjectURL(b),a=document.createElement('a');
  a.href=u;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1200);
}
function stamp(){const d=new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;}

function expMd(){
  const ks=Object.keys(NOTES).filter(k=>NOTES[k]&&NOTES[k].txt);
  if(!ks.length){toast('还没有记录任何结论');return;}
  const order=Object.keys(TIPS);
  ks.sort((a,b)=>order.indexOf(a)-order.indexOf(b));
  let md=`# PCR Workbench · ${VIEW==='home'?'总览首页':'任务处理页'} · 评审结论\n\n`;
  md+=`导出时间：${new Date().toLocaleString('zh-CN')}　|　共 ${ks.length} 条\n\n`;
  const grp={agreed:[],pending:[],open:[]};
  ks.forEach(k=>grp[NOTES[k].st||'pending'].push(k));
  md+=`> 已确认 ${grp.agreed.length}　待确认 ${grp.pending.length}　有争议 ${grp.open.length}\n\n---\n\n`;
  ks.forEach((k,i)=>{
    const t=TIPS[k],n=NOTES[k];
    md+=`## ${i+1}. ${t.t}\n\n`;
    md+=`**状态**：${ST[n.st||'pending']}${n.at?`　（${n.at}）`:''}\n\n`;
    md+=`**讨论结论**\n\n${n.txt}\n\n`;
    md+=`<details><summary>原设计说明</summary>\n\n`;
    md+=`- 交互逻辑：${t.ix}\n- 功能点：${t.fn}\n`;
    if(t.ref)md+=`- 依据：${t.ref.join('、')}\n`;
    md+=`\n</details>\n\n`;
  });
  md+=`---\n\n### 待办\n\n`;
  grp.open.concat(grp.pending).forEach(k=>md+=`- [ ] ${TIPS[k].t}（${ST[NOTES[k].st||'pending']}）\n`);
  dl(`PCR${VIEW==='home'?'首页':'任务页'}评审结论_${stamp()}.md`,md,'text/markdown');
  toast(`已导出 ${ks.length} 条结论`);
}

function expHtml(){
  const n=Object.values(ALL.home).filter(x=>x&&x.txt).length+Object.values(ALL.task).filter(x=>x&&x.txt).length;
  if(!n){toast('还没有记录任何结论');return;}
  let src=document.documentElement.outerHTML;
  // strip any previously injected seed, then inject current notes
  src=src.replace(/<script id="seed">[\s\S]*?<\/script>/,'');
  const seed=`<script id="seed">window.__SEED__=${JSON.stringify(ALL)};<\/script>`;
  src=src.replace('</head>',seed+'</head>');
  dl(`PCR原型_含批注_${stamp()}.html`,'<!DOCTYPE html>'+src,'text/html');
  toast('已导出带批注的原型，可直接发给同事');
}

function impJson(inp){
  const f=inp.files&&inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);let c=0;
      const isMulti=d.home||d.task;
      ['home','task'].forEach(v=>{
        const src=isMulti?d[v]:(v===VIEW?d:null); if(!src)return;
        const dict=(v==='home'?TIPS_HOME:TIPS_TASK);
        Object.keys(src).forEach(k=>{if(dict[k]&&src[k]&&src[k].txt){ALL[v][k]=src[k];c++;}});
        try{localStorage.setItem(LSKS[v],JSON.stringify(ALL[v]));}catch(e){}
      });
      NOTES=ALL[VIEW];paintDots();hideTip();toast(`已合并导入 ${c} 条结论`);
    }catch(e){toast('文件格式无法识别');}
    inp.value='';
  };
  r.readAsText(f);
}

function clearAll(){
  const n=Object.values(NOTES).filter(x=>x&&x.txt).length;
  if(!n){toast('当前没有结论可清空');return;}
  if(!confirm(`将清空当前视图保存的 ${n} 条讨论结论，且无法撤销。\n建议先「导出纪要」再清空。确定继续？`))return;
  NOTES={};saveNotes();hideTip();toast('已清空全部结论');
}

/* ══════════ 结论清单面板 ══════════ */
let lpFil='all',lockScroll=false;
function dotOf(key){
  return [...document.querySelectorAll('.tipdot')].find(d=>{
    const m=(d.getAttribute('onclick')||'').match(/'(\w+)'/);return m&&m[1]===key;});
}
function openList(){
  renderList();
  document.getElementById('listp').classList.add('show');
  document.getElementById('lscrim').classList.add('show');
}
function closeList(){
  document.getElementById('listp').classList.remove('show');
  document.getElementById('lscrim').classList.remove('show');
}
function setFil(b){
  lpFil=b.dataset.f;
  document.querySelectorAll('#lpfil button').forEach(x=>x.classList.toggle('on',x===b));
  renderList();
}
function tipNum(key){
  const dict=(VIEW==='task'?TIPS_TASK:TIPS_HOME);
  const i=Object.keys(dict).indexOf(key);
  if(VIEW==='task') return i+21;
  return i<20 ? i+1 : 35+(i-20);
}
function renderList(){
  const q=(document.getElementById('lpq').value||'').trim().toLowerCase();
  const keys=Object.keys(TIPS);
  const done=keys.filter(k=>NOTES[k]&&NOTES[k].txt).length;
  document.getElementById('lpsub').textContent=`共 ${keys.length} 处说明 · 已讨论 ${done}`;
  document.getElementById('lpbar').style.width=(done/keys.length*100)+'%';

  const rows=keys.map(k=>({k,i:tipNum(k),t:TIPS[k],n:NOTES[k]})).filter(r=>{
    const st=r.n&&r.n.txt?(r.n.st||'pending'):null;
    if(lpFil==='noted'&&!st)return false;
    if(lpFil==='none'&&st)return false;
    if(['open','pending','agreed'].includes(lpFil)&&st!==lpFil)return false;
    if(q){const hay=(r.t.t+' '+(r.n&&r.n.txt||'')).toLowerCase();if(!hay.includes(q))return false;}
    return true;
  });

  const host=document.getElementById('lplist');
  if(!rows.length){host.innerHTML='<div class="lp-empty">没有符合条件的条目</div>';return;}
  host.innerHTML=rows.map(r=>{
    const has=r.n&&r.n.txt, st=has?(r.n.st||'pending'):'none';
    const label=has?ST[st]:'未讨论';
    const sub=has?r.n.txt:r.t.ix;
    return `<button class="li ${has?'has':''}" onclick="goTip('${r.k}')">
      <span class="ln">${r.i}</span>
      <span class="lc"><span class="lt">${r.t.t}</span><span class="lx">${sub.replace(/</g,'&lt;')}</span></span>
      <span class="lst ${st}">${label}</span></button>`;
  }).join('');
}
function goTip(key){
  closeList();
  const d=dotOf(key);
  if(!d){toast('该标记在当前任务视图中不可见，请先在左侧切换任务');return;}
  lockScroll=true;
  d.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>{
    d.classList.add('flash');
    setTimeout(()=>d.classList.remove('flash'),1600);
    showTip({stopPropagation(){},currentTarget:d},key, tipNum(key));
    setTimeout(()=>lockScroll=false,120);
  },460);
}

/* ══════════ TIP 弹层 ══════════ */
let tipEl=null;
function ensureTip(){
  if(tipEl)return tipEl;
  tipEl=document.createElement('div');
  tipEl.className='tipcard';
  document.body.appendChild(tipEl);
  return tipEl;
}
function hideTip(){if(tipEl)tipEl.classList.remove('show');
  document.querySelectorAll('.tipdot.act').forEach(d=>d.classList.remove('act'));}

function showTip(e,key,num){
  e.stopPropagation();
  const d=TIPS[key];if(!d)return;
  const nt=NOTES[key]||{txt:'',st:'pending'};
  const el=ensureTip();
  el.innerHTML=`
    <div class="th"><span class="tn">${num}</span><span class="tt">${d.t}</span>
      <button class="tx" onclick="hideTip()">×</button></div>
    <div class="tipsec ix"><div class="sl">◆ 交互逻辑</div><div class="sb">${d.ix}</div></div>
    <div class="tipsec fn"><div class="sl">◆ 功能点说明</div><div class="sb">${d.fn}</div></div>
    ${d.ref?`<div class="tipref">${d.ref.map(r=>`<span class="rf">${r}</span>`).join('')}</div>`:''}
    <div class="conc">
      <div class="conc-h"><span class="sl">◆ 讨论结论</span>
        <span class="who">${nt.at?'更新于 '+nt.at:'尚未记录'}</span></div>
      <div class="stchips">
        ${Object.keys(ST).map(s=>`<button data-s="${s}" class="${(nt.st||'pending')===s?'on':''}"
          onclick="setSt('${key}','${s}')">${ST[s]}</button>`).join('')}
      </div>
      <textarea id="concta" placeholder="记录会上的结论、修改意见或待办…">${(nt.txt||'').replace(/</g,'&lt;')}</textarea>
      <div class="conc-f">
        <span class="saved" id="savedtag">✓ 已保存到本机</span>
        <span class="hint" id="hinttag">Ctrl+Enter 保存</span><span class="sp"></span>
        <button class="cbtn g" onclick="delConc('${key}')">删除</button>
        <button class="cbtn p" onclick="saveConc('${key}')">保存结论</button>
      </div>
    </div>`;
  el.classList.add('show');
  const r=e.currentTarget.getBoundingClientRect();
  const w=326,h=el.offsetHeight;
  let left=r.right+10, top=r.top-6;
  if(left+w>innerWidth-14) left=r.left-w-10;
  if(left<14) left=14;
  if(top+h>innerHeight-14) top=Math.max(14,innerHeight-h-14);
  el.style.left=left+'px'; el.style.top=top+'px';
  document.querySelectorAll('.tipdot.act').forEach(x=>x.classList.remove('act'));
  e.currentTarget.classList.add('act');
  const ta=el.querySelector('#concta');
  ta.addEventListener('keydown',ev=>{
    ev.stopPropagation();
    if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){saveConc(key);}
  });
}
document.addEventListener('click',ev=>{
  if(tipEl&&!tipEl.contains(ev.target)&&!ev.target.closest('.tipdot')
     &&!ev.target.closest('.listp'))hideTip();
});
addEventListener('scroll',()=>{if(!lockScroll)hideTip();},true);
addEventListener('resize',hideTip);
addEventListener('keydown',e=>{if(e.key==='Escape'){hideTip();closeList();closeMenu();if(typeof closePlus==='function')closePlus();if(typeof hideGuide==='function')hideGuide();}});

/* ══════════ 原有交互 ══════════ */
let tm;
function toast(m){const t=document.getElementById('toast');document.getElementById('tmsg').textContent=m;
  t.classList.add('show');clearTimeout(tm);tm=setTimeout(()=>t.classList.remove('show'),2400);}

function ev(el){const b=el.parentElement.querySelector('.evbox');b.classList.toggle('show');
  el.querySelector('svg').style.transform=b.classList.contains('show')?'rotate(180deg)':'';}

function tog(row,id){
  const p=document.getElementById(id),open=p.classList.contains('open');
  document.querySelectorAll('.inline').forEach(x=>x.classList.remove('open'));
  document.querySelectorAll('.wrow').forEach(x=>x.classList.remove('open'));
  if(!open){p.classList.add('open');row.classList.add('open');}
}
function pick(b){b.parentElement.querySelectorAll('.path').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');document.getElementById('p1btn').disabled=false;}
function done(id){document.getElementById(id).classList.remove('open');
  document.querySelectorAll('.wrow').forEach(x=>x.classList.remove('open'));toast('已确认并写回 PACE');}
function jump(n){toast('已将「'+n+'」设为当前话题');}
function askPreset(q){
  switchView('home');
  const i=document.getElementById('askin');
  if(i){i.value=q;i.focus();}
  toast('已填入提问，回车即可开始分析');
}
function askq(b){document.getElementById('askin').value=b.textContent;document.getElementById('askin').focus();hideGuide();}
function sendq(){const v=document.getElementById('askin').value.trim();
  if(!v){document.getElementById('askin').focus();return;}
  if(typeof PARSE!=='undefined' && PARSE.active){
    const host=document.getElementById('parseUser');
    const el=document.createElement('div');el.className='bub me';el.textContent=v;
    host.appendChild(el);document.getElementById('askin').value='';
    toast('已补充信息');return;
  }
  if(typeof PARSE!=='undefined' && PARSE.createIntent){startParse(v);return;}
  toast('已新建会话：'+(v.length>16?v.slice(0,16)+'…':v));document.getElementById('askin').value='';}
document.getElementById('askin').addEventListener('keydown',e=>{if(e.key==='Enter')sendq();});

/* ══════════ 启动初始化 ══════════ */
(function init(){
  // 若是「导出批注版」打开的文件，优先载入其中携带的结论
  if(window.__SEED__){
    let c=0;
    ['home','task'].forEach(v=>{
      const src=window.__SEED__[v]; if(!src)return;
      const dict=(v==='home'?TIPS_HOME:TIPS_TASK);
      Object.keys(src).forEach(k=>{if(dict[k]&&src[k]&&src[k].txt){ALL[v][k]=src[k];c++;}});
      try{localStorage.setItem(LSKS[v],JSON.stringify(ALL[v]));}catch(e){}
    });
    NOTES=ALL[VIEW];
    if(c)setTimeout(()=>toast(`本文件携带 ${c} 条讨论结论`),700);
  }
  paintDots();
})();
