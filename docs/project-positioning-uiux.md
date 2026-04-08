# TCG Wholesale Website 设计执行说明

## 1. 文档目的

这份文档用于给 UI/UX 设计师直接落地使用。

目标不是讲项目背景，而是明确以下内容：

- 这个网站是什么类型的产品
- 设计时应优先解决什么问题
- 页面需要包含哪些内容
- Catalog 页面应该如何组织
- 哪些信息必须展示
- 哪些状态必须被设计出来
- 整体视觉风格应该朝什么方向执行

设计师拿到这份文档后，应能直接开始输出：

- 信息架构
- 页面线框图
- Catalog 页面高保真设计
- 登录前后体验区分方案
- 设计组件和状态样式

## 2. 项目定义

### 2.1 产品类型

这是一个 **TCG 卡牌行业 sale 网站**。

它不是面向玩家的零售商城，而是面向卡店、零售商、经销商、直播卖家等 B 端客户的批发采购平台。

### 2.2 商业模式

- 用户不能直接注册后采购
- 用户必须先提交开户申请
- 后台审核通过后，账户才可登录
- 只有审核通过的客户才能查看完整批发价格并发起采购
- 客户提交 checkout 后不会直接付款，而是先生成 purchase quote
- sales rep 审核价格与数量后，客户才进入付款阶段

### 2.3 产品核心

这个网站的核心不是内容营销，而是采购效率。

最重要的页面是：

1. 开户申请页
2. 登录页
3. Catalog 列表页
4. 购物车 / Quote 提交流程

其中 **Catalog 列表页是整个项目的设计重点**。

## 3. 设计目标

设计必须服务下面四个目标：

### 3.1 让客户快速理解网站是做什么的

用户进入网站后，需要迅速知道：

- 这是 TCG 批发平台
- 这是 B2B 网站
- 需要申请开户
- 审核通过后才可登录采购

### 3.2 让潜在客户愿意申请开户

开户申请页必须传递出：

- 平台是专业可信的
- 开户流程清晰
- 提交资料是合理的
- 审核后可获得批发采购权限

### 3.3 让已审核客户高效找货和发起采购

登录后的体验重点不是品牌展示，而是：

- 快速搜索
- 快速筛选
- 快速查看价格和库存
- 快速输入数量加购
- 快速提交 quote request

### 3.4 支持高频使用

这个网站不是低频浏览型站点，而是高频采购工具。

设计必须适合长时间使用，因此需要：

- 结构稳定
- 信息密度高
- 可读性强
- 操作路径短

## 4. 设计原则

### 4.1 总原则

整体设计方向为：

- 简洁
- 专业
- 克制
- 高效率
- 可持续使用

### 4.2 明确不要做成什么样

不要做成：

- 面向玩家的零售电商风格
- 很强的潮玩、二次元、娱乐化视觉
- 大量 Banner 和营销区块堆叠
- 大卡片瀑布流产品列表
- 重装饰、轻信息的页面结构

### 4.3 明确要做成什么样

应该做成：

- 接近行业批发 catalog 系统
- 类似采购后台的高效率信息界面
- 视觉上专业，但不过度“后台感”
- 品牌感轻量存在，功能性优先

## 5. 用户与使用场景

### 5.1 目标用户

- 本地卡店
- Hobby Store
- TCG 专门零售商
- 线上卖家
- 分销客户
- 长期批量采购客户

### 5.2 用户最关心的信息

设计时要围绕这些问题组织页面：

- 这个产品是什么
- 属于哪个游戏 / 系列
- 有没有货
- 是否预售
- SKU 是什么
- UPC 是什么
- 批发价格是多少
- 能不能提交采购请求
- 当前 quote 是否已审核完成

### 5.3 用户最常做的动作

- 搜索产品
- 按品牌 / 系列筛选
- 查看价格
- 查看库存状态
- 输入采购数量
- 加入购物车
- 提交 quote request
- 查看 quote 状态
- 审核通过后付款

## 6. 站点结构

## 6.1 登录前页面

设计师需要先覆盖这些页面：

- 首页
- About / Why Us
- Contact
- FAQ / Ordering Policy
- 开户申请页
- 登录页

### 登录前页面目标

- 建立信任
- 说明 B2B 模式
- 引导开户
- 引导登录

## 6.2 登录后页面

设计师需要重点覆盖这些页面：

- Catalog 列表页
- 产品详情页
- 购物车页
- Checkout 页
- Quote 详情页
- Quote 列表页
- 订单列表页
- 订单详情页
- 账户中心

### 登录后页面目标

- 让客户高效采购
- 缩短查品到提交采购请求路径
- 减少跳转成本

## 7. 页面优先级

### P0 必做页面

- 开户申请页
- 登录页
- Catalog 列表页
- 购物车页
- Checkout 页
- Quote 详情页

### P1 次重要页面

- 产品详情页
- Quote 列表页
- 订单列表页
- 订单详情页
- 账户中心

### P2 辅助页面

- 首页
- About
- FAQ
- Contact

设计资源优先投入在 P0 页面，尤其是 Catalog。

## 7.1 Header 设计说明

Header 是全站核心导航组件，需要在登录前和登录后保持统一结构，只在右侧操作区做状态变化。

### Header 必备内容

- Logo
- Search Bar
- Home
- Catalog
- Pre-Order
- Contact
- User Icon / User Dropdown
- Cart Icon

### Header 布局建议

建议采用三段式结构：

- 左侧：Logo
- 中间：Search Bar + 主导航
- 右侧：用户入口 + 购物车入口

如果桌面端空间有限，也可以采用：

- 第一行：Logo + Search Bar + User / Cart
- 第二行：Home / Catalog / Pre-Order / Contact

但整体上仍应保持简洁、稳定、易扫读。

### 主导航要求

Header 主导航固定包含：

- Home
- Catalog
- Pre-Order
- Contact

不要把主导航做得过多过杂，核心是支持客户快速进入找货与联系路径。

### 搜索栏要求

Header 内必须有全局搜索栏。

建议支持搜索：

- Product Name
- SKU
- UPC
- Keyword

搜索栏应是 Header 中非常高优先级的元素，因为找货是用户最核心的动作之一。

### 未登录状态

如果用户未登录：

- 右侧显示 User Icon
- User Dropdown 中显示：
  - Log In
  - Open Account
- 不显示 Cart Icon

设计重点：

- 让未登录用户明确看到 `Log In` 和 `Open Account`
- 不要让未登录用户误以为可以直接购物车下单

### 已登录状态

如果用户已登录：

- 右侧显示 User Icon
- 右侧显示 Cart Icon
- User Dropdown 中建议显示：
  - My Account
  - My Quotes
  - Orders
  - Log Out

### Header 交互要求

- 当前页面对应的导航项要有明确选中态
- User Dropdown 要有清晰的 hover / click 展开状态
- Cart Icon 仅在登录后显示
- 未登录状态下，任何加购相关动作都应引导登录或开户

## 8. Catalog 页面设计说明

## 8.1 页面定位

Catalog 页面是这个网站最重要的核心业务页面。

它本质上是一个采购工作台，不是商品橱窗。

设计目标：

- 用户一眼扫到大量产品信息
- 用户可以快速筛选
- 用户不必频繁进入详情页
- 用户能直接在列表完成加购

## 8.2 页面布局

建议采用双栏布局：

- 左侧：固定筛选区
- 右侧：产品列表区

建议关系如下：

- 左侧宽度稳定，信息分组清楚
- 右侧优先保证表格信息展示完整
- 页面整体以桌面端优先设计
- 平板和移动端再做折叠式适配

## 8.3 Catalog 页面模块

页面从上到下建议包含：

### A. 页面工具栏

- Breadcrumb
- 页面标题
- 搜索框
- 排序入口
- 每页数量选择
- 视图控制（如果需要）
- 已选筛选标签

### B. 左侧筛选栏

- 分类筛选
- 品牌 / Manufacturer
- Game Title
- Series / Set
- Product Type
- Availability
- Pre-order
- Release Date
- Price Range
- 搜索筛选项
- Clear All

### C. 右侧产品列表

- 表头
- 产品行
- 分页

## 8.4 Catalog 产品行结构

设计师在画产品行时，按“一行一个产品”处理。

推荐字段如下：

- Product Image
- Product Name
- Brand / Manufacturer
- Game / TCG Title
- Series / Set
- SKU
- UPC
- Wholesale Price
- MSRP
- Availability
- Release Date
- Qty Input
- Add to Cart

### 必须优先保证展示的字段

- Product Name
- SKU
- Wholesale Price
- Availability
- Qty Input
- Add to Cart

### 建议处理方式

- 产品名允许占用更大宽度
- SKU / UPC 用较小但清晰的等宽或规整数字排版
- 价格字段要易扫读
- 数量输入与加入购物车操作要靠近
- 状态信息尽量标签化

## 8.5 Catalog 筛选设计要求

左侧筛选区需要明确做成效率工具，而不是装饰模块。

建议设计要求：

- 默认展示常用筛选组
- 每组支持展开 / 折叠
- 多选优先
- 选中项要有明显状态
- 可快速清空全部筛选
- 如果筛选项较多，支持组内搜索
- 已选筛选应在右侧顶部有回显标签

### 推荐筛选维度

- Category
- Manufacturer
- Game Title
- Series / Set
- Product Type
- In Stock / Out of Stock
- Pre-Order
- New Arrival
- Release Date
- Price Range

## 8.6 搜索与排序要求

Catalog 顶部必须具备搜索与排序。

### 搜索建议支持

- Product Name
- SKU
- UPC
- Keyword

### 排序建议至少覆盖

- Relevance
- Newest
- Release Date
- Name
- Price

## 8.7 状态设计

设计师需要为以下状态准备统一样式：

- In Stock
- Low Stock
- Out of Stock
- Pre-Order
- New Arrival
- Coming Soon

### 状态设计要求

- 用标签表达，不只靠文字
- 颜色要有区分，但不能太刺眼
- 同一套状态在列表页、详情页、购物车页保持一致

## 9. 产品详情页设计说明

虽然列表页是核心，但详情页仍需要存在。

### 详情页目标

- 补充列表页放不下的信息
- 提供更完整的产品资料
- 支持客户确认采购细节

### 详情页建议内容

- 产品图
- 产品名称
- 品牌 / 游戏 / 系列
- SKU
- UPC
- 批发价格
- MSRP
- 库存状态
- 预售状态
- 发售时间
- 包装信息
- 产品描述
- 数量输入
- 加购按钮

## 10. 开户申请页设计说明

开户申请页是登录前最重要的转化页面。

### 页面目标

- 让 B2B 客户理解申请条件
- 降低填写门槛
- 提升提交完成率
- 体现平台审核制的专业性

### 页面应包含的内容

- 页面标题与说明
- 开户价值说明
- 审核逻辑说明
- 申请表单
- 提交成功反馈

### 开户表单字段要求

开户表单不能只做基础联系方式，必须覆盖个人信息、公司信息、销售形态、品牌兴趣和资质信息。

### A. 个人信息

- Contact Name
- Email
- Phone
- Job Title / Role

### B. 公司信息

- Business Name
- Business Type
- Company Address
- City
- State / Province
- ZIP / Postal Code
- Country
- Website
- Store Link / Marketplace Link

### C. 销售形态

- Is your business online, physical retail, or both?
- If physical retail: Store Address
- If online: Main sales channels

`Sales Channel` 建议设计为可多选或组合输入，常见选项可包括：

- Physical Store
- Shopify Website
- TikTok Shop
- Whatnot
- eBay
- Amazon
- Other

### D. 感兴趣品牌 / 产品方向

这一项需要明确设计成多选题，用于销售侧判断客户采购方向，也用于后续客户分组。

建议字段名：

- Which brands are you interested in? (Multi-select)

首批可选项建议包含：

- Pokemon
- Yu-Gi-Oh!
- Dragon Ball Super
- One Piece
- KAYOU Naruto
- Weiss Schwarz
- Union Arena
- Gundam Card Game
- Digimon
- Other

### E. 资质与税务信息

这一组在页面中必须单独成组，不要埋在普通备注里。

- Do you have a reseller permit? `Yes / No`
- Do you have a Tax ID? `Yes / No`
- Reseller Permit Number
- Tax ID Number
- Resale Certificate Upload

如果业务上只要求二选一，也可以在文案中明确：

- Do you have a reseller permit or tax ID? `Yes / No`

但从设计执行上，建议拆成两个单独问题，更方便后续校验与后台审核。

### F. 其他补充信息

- Shipping Address
- Additional Notes
- Expected Purchase Volume
- Preferred Brands / Notes

### 表单交互要求

- 按信息组分区展示，不要把所有字段堆成一长列
- `online / physical / both` 需要做成明确可选项
- 当用户选择 `physical retail` 时，展示实体店地址字段
- 当用户选择 `online` 或 `both` 时，展示线上销售渠道字段
- 品牌兴趣必须支持多选
- `reseller permit`、`tax ID`、上传材料等字段应有清晰的条件显示逻辑
- 提交前需让用户明确知道“申请提交后需要等待人工审核”

### 设计要求

- 表单分组清楚
- 必填与选填明确
- 文案直白，不要过度营销
- 提交按钮明确
- 成功页或成功提示要清楚说明“等待审核”

## 11. 登录页设计说明

### 页面目标

- 让已审核客户快速登录
- 给未开户用户明确开户入口

### 页面应包含

- 登录表单
- 忘记密码入口
- 开户申请入口
- 简短说明：仅限审核通过账户登录

## 12. 购物车与下单页设计说明

### 购物车页目标

- 让客户快速复核采购内容
- 能方便修改数量
- 能清楚查看预估金额
- 为提交 purchase quote 做准备

### 购物车页应包含

- 产品列表
- SKU
- 单价
- 数量
- 小计
- 删除
- 更新数量
- 继续采购
- 进入 checkout

### Checkout 页应包含

- 收货信息
- 账单信息
- 配送方式
- 采购备注
- 商品汇总
- 预估价格汇总
- 提交 quote request

### Checkout 流程说明

这个项目的 checkout 不是直接付款结账，而是生成一份 purchase quote。

正确业务流程如下：

1. 登录客户选择商品并加入购物车
2. 客户进入 checkout，提交采购请求
3. 系统生成 purchase quote
4. sales rep 审核 quote
5. sales rep 可修改价格或可供数量
6. 审核完成后 quote 返回给客户
7. 客户确认 quote 并完成付款

因此设计时必须明确区分三个概念：

- Cart
- Quote
- Final Payment

### Checkout 页文案要求

页面中需要明确提示用户：

- 当前提交的是采购请求，不是最终付款
- 最终价格和可供数量可能由 sales rep 审核后调整
- 审核完成后，客户会收到可付款的 quote

### Quote 状态设计

设计师需要补充 quote 相关状态，不要只设计订单状态。

建议至少包含：

- Draft
- Submitted
- Under Review
- Revised by Sales Rep
- Awaiting Customer Payment
- Paid
- Cancelled

### Quote 列表页应包含

- Quote Number
- Submitted Date
- Total Items
- Estimated Total
- Quote Status
- Last Updated
- View Quote

### Quote 详情页应包含

- Quote Number
- Customer Info
- Shipping / Billing Info
- Item List
- Requested Qty
- Approved Qty
- Requested Price / Original Price
- Revised Price
- Quote Notes
- Sales Rep Notes
- Quote Status
- Payment CTA

### Quote 详情页设计要求

- 明确让客户看出哪些价格或数量被 sales rep 修改过
- 原始请求值与审核后值应可对比
- 当 quote 进入 `Awaiting Customer Payment` 状态时，付款按钮要明确突出
- 当 quote 仍在审核中时，不应展示可误解为立即支付的主 CTA

## 13. 视觉风格说明

## 13.1 总体风格

建议视觉基调为：

- 商务
- 清爽
- 稳定
- 专业
- 克制

设计感觉应该接近成熟批发平台，而不是潮流消费品牌站。

## 13.2 视觉关键词

- Structured
- Clean
- Efficient
- Trustworthy
- Lightweight Brand Feel

## 13.3 色彩建议

推荐两套方向，任选其一深化：

### 方向 A：专业蓝

- Primary: `#1E4E8C`
- Primary Dark: `#163B69`
- Accent: `#F59E0B`
- Background: `#F7F8FA`
- Surface: `#FFFFFF`
- Border: `#D9DEE7`
- Text: `#1F2937`
- Muted Text: `#6B7280`

### 方向 B：蓝绿采购风

- Primary: `#0F766E`
- Primary Dark: `#115E59`
- Accent: `#D97706`
- Background: `#F5F7F7`
- Surface: `#FFFFFF`
- Border: `#D6DDDD`
- Text: `#1F2937`

### 色彩使用原则

- 主色用于导航、按钮、选中态、关键标题
- 强调色用于重点操作和状态提示
- 背景保持浅色，便于长时间看表格
- 不要使用大面积高饱和颜色

## 13.4 排版建议

- 标题层级清楚
- 正文偏中性、偏功能化表达
- 表格和列表中的数字、SKU、UPC 要易读
- 行高、间距稳定，避免视觉噪音

## 13.5 组件风格建议

- 按钮简洁直接
- 表单规整
- 表格边界清楚
- 标签状态统一
- 卡片感弱于表格感

## 14. 响应式设计要求

### 桌面端

桌面端是主设计场景，优先保证：

- 左侧筛选完整展示
- 右侧列表字段尽可能完整
- 可同时进行搜索、筛选、加购

### 平板 / 移动端

移动端重点不是还原桌面端，而是保证核心操作可用：

- 筛选改为抽屉
- 列表字段压缩
- 保留产品名、SKU、价格、状态、数量、加购
- 避免横向信息过载

## 15. 设计交付建议

设计师建议按以下顺序产出：

1. 站点信息架构
2. Catalog 页面低保真线框
3. 开户申请页和登录页低保真
4. Catalog 页面高保真
5. 购物车、Checkout、Quote 页高保真
6. 关键组件与状态样式

## 16. 本轮设计必须产出的页面

第一轮建议至少交付以下页面：

- 首页
- 开户申请页
- 登录页
- Catalog 列表页
- 产品详情页
- 购物车页
- Checkout 页
- Quote 详情页

## 17. 本轮设计必须产出的组件

- Header
- Footer
- Search Bar
- Filter Group
- Product Row
- Status Tag
- Qty Input
- Add to Cart Button
- Table Header
- Pagination
- Form Field
- Primary / Secondary Button

## 18. 给设计师的最终执行结论

这个项目的设计方向可以概括为一句话：

**做一个专业、清晰、简洁、适合高频采购的 TCG B2B catalog 系统。**

请设计时始终优先考虑：

- 找货效率
- 筛选效率
- 状态清晰
- 价格与库存可读性
- 登录前后体验差异

请不要优先考虑：

- 炫酷视觉
- 强营销首页
- 过度装饰
- 零售化大卡片商品流
