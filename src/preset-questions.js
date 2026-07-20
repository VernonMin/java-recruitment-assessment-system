const STATUS = "published";
const OBJECTIVE_SCORE = 5;
const SUBJECTIVE_SCORE = 20;

function sc(stem, options, answer, analysis, difficulty, tags) {
  return {
    type: "single_choice",
    stem,
    score: OBJECTIVE_SCORE,
    difficulty,
    status: STATUS,
    options,
    answer,
    analysis,
    tags,
    caseSensitive: false
  };
}

function mc(stem, options, answer, analysis, difficulty, tags) {
  return {
    type: "multiple_choice",
    stem,
    score: OBJECTIVE_SCORE,
    difficulty,
    status: STATUS,
    options,
    answer,
    analysis,
    tags,
    caseSensitive: false
  };
}

function tf(stem, isTrue, analysis, difficulty, tags) {
  return {
    type: "true_false",
    stem,
    score: OBJECTIVE_SCORE,
    difficulty,
    status: STATUS,
    options: [
      { optionKey: "T", optionText: "正确" },
      { optionKey: "F", optionText: "错误" }
    ],
    answer: isTrue ? "T" : "F",
    analysis,
    tags,
    caseSensitive: false
  };
}

function fb(stem, answer, analysis, difficulty, tags) {
  return {
    type: "fill_blank",
    stem,
    score: OBJECTIVE_SCORE,
    difficulty,
    status: STATUS,
    answer,
    analysis,
    tags,
    caseSensitive: false
  };
}

function sa(stem, analysis, difficulty, tags) {
  return {
    type: "short_answer",
    stem,
    score: SUBJECTIVE_SCORE,
    difficulty,
    status: STATUS,
    analysis,
    tags,
    caseSensitive: false
  };
}

function scen(stem, analysis, difficulty, tags) {
  return {
    type: "scenario_answer",
    stem,
    score: SUBJECTIVE_SCORE,
    difficulty,
    status: STATUS,
    analysis,
    tags,
    caseSensitive: false
  };
}

export const BULK_QUESTION_BANK = [
  sc("在 Java 中，负责加载并执行字节码的核心运行时组件是什么？", [
    { optionKey: "A", optionText: "JVM" },
    { optionKey: "B", optionText: "JDBC" },
    { optionKey: "C", optionText: "JAR" },
    { optionKey: "D", optionText: "Javadoc" }
  ], "A", "Oracle Java 文档强调 JVM 负责字节码执行与跨平台运行。", 1, ["Java基础", "JVM", "来源:Oracle Java 文档"]),
  sc("关于 HashMap 的 key 和 value，下列哪项正确？", [
    { optionKey: "A", optionText: "不允许 null key，也不允许 null value" },
    { optionKey: "B", optionText: "允许一个 null key，也允许 null value" },
    { optionKey: "C", optionText: "允许多个 null key，但不允许 null value" },
    { optionKey: "D", optionText: "线程安全，可直接用于高并发写入" }
  ], "B", "HashMap 允许一个 null key 和多个 null value，但不是并发容器。", 2, ["集合", "HashMap", "来源:Oracle Java API"]),
  sc("try-with-resources 的主要目的是什么？", [
    { optionKey: "A", optionText: "自动关闭资源" },
    { optionKey: "B", optionText: "自动重试事务" },
    { optionKey: "C", optionText: "自动记录日志" },
    { optionKey: "D", optionText: "自动开启线程" }
  ], "A", "Oracle 异常教程明确说明 try-with-resources 会在语句结束时关闭资源。", 1, ["异常处理", "资源管理", "来源:Oracle 异常教程"]),
  sc("List.of(\"a\", \"b\") 返回的集合特征通常是？", [
    { optionKey: "A", optionText: "线程安全且可变" },
    { optionKey: "B", optionText: "固定长度但元素可替换" },
    { optionKey: "C", optionText: "不可变" },
    { optionKey: "D", optionText: "自动去重" }
  ], "C", "JDK 工厂方法返回的集合通常为不可变集合。", 2, ["集合工厂方法", "List", "来源:Oracle Java API"]),
  sc("Stream.filter 的返回值是什么？", [
    { optionKey: "A", optionText: "boolean" },
    { optionKey: "B", optionText: "新的 Stream" },
    { optionKey: "C", optionText: "List" },
    { optionKey: "D", optionText: "Iterator" }
  ], "B", "filter 是中间操作，返回新的 Stream 以继续链式调用。", 1, ["Stream", "函数式编程", "来源:Oracle Java 文档"]),
  sc("当变量可能为 null 时，创建 Optional 更合适的方法是？", [
    { optionKey: "A", optionText: "Optional.of" },
    { optionKey: "B", optionText: "Optional.ofNullable" },
    { optionKey: "C", optionText: "Optional.get" },
    { optionKey: "D", optionText: "Optional.stream" }
  ], "B", "ofNullable 允许传入 null，of 传 null 会抛异常。", 1, ["Optional", "空值处理", "来源:Oracle Java API"]),
  sc("在 Spring Framework 中，默认的 Bean scope 是什么？", [
    { optionKey: "A", optionText: "prototype" },
    { optionKey: "B", optionText: "request" },
    { optionKey: "C", optionText: "singleton" },
    { optionKey: "D", optionText: "session" }
  ], "C", "Spring Bean scope 文档说明 singleton 是默认作用域。", 1, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  sc("Spring 声明式事务默认对哪类异常自动回滚？", [
    { optionKey: "A", optionText: "所有 checked exception" },
    { optionKey: "B", optionText: "RuntimeException 及其子类" },
    { optionKey: "C", optionText: "IOException" },
    { optionKey: "D", optionText: "SQLException" }
  ], "B", "Spring 默认对未检查异常自动回滚。", 2, ["Spring", "事务", "来源:Spring Framework 事务文档"]),
  sc("Spring Boot 默认暴露健康检查端点的路径通常是？", [
    { optionKey: "A", optionText: "/health" },
    { optionKey: "B", optionText: "/manage/health" },
    { optionKey: "C", optionText: "/actuator/health" },
    { optionKey: "D", optionText: "/system/health" }
  ], "C", "Spring Boot Actuator 文档给出的默认健康端点路径是 /actuator/health。", 1, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),
  sc("以下哪个接口最能表达“元素唯一，不保证插入顺序”的语义？", [
    { optionKey: "A", optionText: "List" },
    { optionKey: "B", optionText: "Queue" },
    { optionKey: "C", optionText: "Set" },
    { optionKey: "D", optionText: "Deque" }
  ], "C", "Set 的核心语义是元素唯一。", 1, ["集合", "Set", "来源:Oracle Java Collections 文档"]),
  sc("volatile 关键字最核心保证的能力是什么？", [
    { optionKey: "A", optionText: "复合操作原子性" },
    { optionKey: "B", optionText: "可见性" },
    { optionKey: "C", optionText: "阻塞队列容量" },
    { optionKey: "D", optionText: "对象深拷贝" }
  ], "B", "volatile 主要保证写入对其他线程可见，不保证 i++ 这类复合操作原子性。", 3, ["并发", "volatile", "来源:Oracle 并发文档"]),
  sc("关于 LocalDate，下列哪项更准确？", [
    { optionKey: "A", optionText: "可直接表示时间戳毫秒值" },
    { optionKey: "B", optionText: "是可变对象" },
    { optionKey: "C", optionText: "只表示日期部分" },
    { optionKey: "D", optionText: "只能表示 UTC 时间" }
  ], "C", "LocalDate 表示不带时区的日期。", 1, ["日期时间", "java.time", "来源:Oracle Java API"]),
  sc("当自定义类重写 equals 时，通常还应该同步重写哪个方法？", [
    { optionKey: "A", optionText: "clone" },
    { optionKey: "B", optionText: "hashCode" },
    { optionKey: "C", optionText: "finalize" },
    { optionKey: "D", optionText: "notifyAll" }
  ], "B", "否则会破坏散列表容器行为。", 2, ["对象模型", "equals/hashCode", "来源:Oracle Java API"]),
  sc("ConcurrentHashMap 更适合解决什么问题？", [
    { optionKey: "A", optionText: "单线程数组排序" },
    { optionKey: "B", optionText: "高并发读写 Map" },
    { optionKey: "C", optionText: "SQL 事务提交" },
    { optionKey: "D", optionText: "对象序列化格式转换" }
  ], "B", "ConcurrentHashMap 为并发访问场景优化。", 3, ["并发", "ConcurrentHashMap", "来源:Oracle Java API"]),
  sc("如果调用 ExecutorService.shutdown()，更符合文档语义的描述是？", [
    { optionKey: "A", optionText: "立即中断所有任务并丢弃队列" },
    { optionKey: "B", optionText: "拒绝新任务，已提交任务继续执行" },
    { optionKey: "C", optionText: "清空线程池并自动回滚数据库" },
    { optionKey: "D", optionText: "强制等待所有 Future 被 get" }
  ], "B", "shutdown 是平滑关闭入口，不等价于 shutdownNow。", 3, ["线程池", "ExecutorService", "来源:Oracle Java Concurrency 文档"]),
  sc("以下哪个注解最直接表示返回值写入 HTTP 响应体？", [
    { optionKey: "A", optionText: "@ControllerAdvice" },
    { optionKey: "B", optionText: "@Bean" },
    { optionKey: "C", optionText: "@ResponseBody" },
    { optionKey: "D", optionText: "@Import" }
  ], "C", "在 Spring Web 中，@ResponseBody 用于直接写出响应体。", 2, ["Spring MVC", "Web", "来源:Spring Framework 文档"]),
  sc("Bean scope 为 prototype 时，下列哪项更准确？", [
    { optionKey: "A", optionText: "容器始终返回同一个实例" },
    { optionKey: "B", optionText: "每次请求 Bean 都可得到新实例" },
    { optionKey: "C", optionText: "只能用于 WebSocket" },
    { optionKey: "D", optionText: "Spring 会自动缓存线程上下文" }
  ], "B", "prototype 表示可创建多个实例。", 2, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  sc("关于 RuntimeException，下列哪项更准确？", [
    { optionKey: "A", optionText: "一定要在方法签名中声明 throws" },
    { optionKey: "B", optionText: "属于受检异常" },
    { optionKey: "C", optionText: "属于未受检异常" },
    { optionKey: "D", optionText: "只能在 finally 中抛出" }
  ], "C", "RuntimeException 及其子类是未受检异常。", 1, ["异常处理", "RuntimeException", "来源:Oracle 异常教程"]),
  sc("对于无状态服务组件，Spring 官方通常更推荐哪种作用域？", [
    { optionKey: "A", optionText: "singleton" },
    { optionKey: "B", optionText: "prototype" },
    { optionKey: "C", optionText: "session" },
    { optionKey: "D", optionText: "request" }
  ], "A", "无状态 Bean 更适合 singleton。", 2, ["Spring", "设计实践", "来源:Spring Framework 文档"]),
  sc("想查看某个具体指标明细时，Spring Boot Actuator 推荐访问哪类路径？", [
    { optionKey: "A", optionText: "/actuator/metrics/{name}" },
    { optionKey: "B", optionText: "/actuator/loggers/{name}" },
    { optionKey: "C", optionText: "/actuator/httptrace/{name}" },
    { optionKey: "D", optionText: "/actuator/env/{name}" }
  ], "A", "Actuator metrics 端点支持按指标名下钻查看。", 2, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),

  mc("关于 Stream API，下列哪些属于中间操作？", [
    { optionKey: "A", optionText: "filter" },
    { optionKey: "B", optionText: "map" },
    { optionKey: "C", optionText: "collect" },
    { optionKey: "D", optionText: "sorted" }
  ], "A,B,D", "filter、map、sorted 都返回新的 Stream；collect 是终止操作。", 2, ["Stream", "来源:Oracle Java 文档"]),
  mc("关于 HashMap 和 ConcurrentHashMap，下列哪些说法正确？", [
    { optionKey: "A", optionText: "HashMap 默认线程安全" },
    { optionKey: "B", optionText: "ConcurrentHashMap 适合并发访问" },
    { optionKey: "C", optionText: "HashMap 允许一个 null key" },
    { optionKey: "D", optionText: "ConcurrentHashMap 允许 null key" }
  ], "B,C", "ConcurrentHashMap 不允许 null key/value。", 3, ["集合", "并发", "来源:Oracle Java API"]),
  mc("关于 Java checked exception，下列哪些描述正确？", [
    { optionKey: "A", optionText: "通常需要 catch 或 throws" },
    { optionKey: "B", optionText: "RuntimeException 是 checked exception" },
    { optionKey: "C", optionText: "IOException 是 checked exception" },
    { optionKey: "D", optionText: "编译器完全不会检查" }
  ], "A,C", "checked exception 受编译器检查。", 2, ["异常处理", "来源:Oracle 异常教程"]),
  mc("关于 Spring 事务传播行为，下列哪些名称是 Spring 官方支持的传播模式？", [
    { optionKey: "A", optionText: "REQUIRED" },
    { optionKey: "B", optionText: "REQUIRES_NEW" },
    { optionKey: "C", optionText: "BEST_EFFORT" },
    { optionKey: "D", optionText: "MANDATORY" }
  ], "A,B,D", "REQUIRED、REQUIRES_NEW、MANDATORY 均为 Spring 支持的传播行为。", 3, ["Spring", "事务传播", "来源:Spring Framework 文档"]),
  mc("下列哪些 Bean scope 只在 web-aware ApplicationContext 中可用？", [
    { optionKey: "A", optionText: "request" },
    { optionKey: "B", optionText: "session" },
    { optionKey: "C", optionText: "singleton" },
    { optionKey: "D", optionText: "application" }
  ], "A,B,D", "singleton 并非 Web 专属作用域。", 2, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  mc("关于 CompletableFuture，下列哪些描述正确？", [
    { optionKey: "A", optionText: "可以链式编排异步阶段" },
    { optionKey: "B", optionText: "只能表示同步结果" },
    { optionKey: "C", optionText: "可以通过 exceptionally 处理异常" },
    { optionKey: "D", optionText: "属于 java.util.concurrent" }
  ], "A,C,D", "CompletableFuture 支持组合、异常处理和异步编排。", 3, ["并发", "CompletableFuture", "来源:Oracle Java API"]),
  mc("关于 synchronized，下列哪些效果是合理的？", [
    { optionKey: "A", optionText: "提供互斥访问" },
    { optionKey: "B", optionText: "提供一定的可见性保障" },
    { optionKey: "C", optionText: "自动把 SQL 改成串行化事务" },
    { optionKey: "D", optionText: "可以修饰实例方法" }
  ], "A,B,D", "synchronized 与数据库事务并不是一回事。", 3, ["并发", "锁", "来源:Oracle Java 文档"]),
  mc("关于 try-with-resources，下列哪些说法正确？", [
    { optionKey: "A", optionText: "资源类型通常需要实现 AutoCloseable" },
    { optionKey: "B", optionText: "语句结束时会自动关闭资源" },
    { optionKey: "C", optionText: "只能管理数据库连接" },
    { optionKey: "D", optionText: "可以减少 finally 中手工关闭代码" }
  ], "A,B,D", "try-with-resources 适用于各种 AutoCloseable 资源。", 2, ["异常处理", "资源管理", "来源:Oracle 异常教程"]),
  mc("关于 Optional，下列哪些方法常用于空值链式处理？", [
    { optionKey: "A", optionText: "map" },
    { optionKey: "B", optionText: "filter" },
    { optionKey: "C", optionText: "orElse" },
    { optionKey: "D", optionText: "wait" }
  ], "A,B,C", "Optional 用于表达可能为空的值及其处理流程。", 2, ["Optional", "来源:Oracle Java API"]),
  mc("关于 ThreadPoolExecutor 的关键参数，下列哪些名称存在？", [
    { optionKey: "A", optionText: "corePoolSize" },
    { optionKey: "B", optionText: "maximumPoolSize" },
    { optionKey: "C", optionText: "queueCapacity" },
    { optionKey: "D", optionText: "keepAliveTime" }
  ], "A,B,D", "queueCapacity 是某些框架配置项表达，不是 ThreadPoolExecutor 构造参数名。", 3, ["线程池", "来源:Oracle Java API"]),
  mc("下列哪些集合接口明确保持元素插入顺序？", [
    { optionKey: "A", optionText: "ArrayList" },
    { optionKey: "B", optionText: "LinkedHashSet" },
    { optionKey: "C", optionText: "HashSet" },
    { optionKey: "D", optionText: "LinkedHashMap 的 entrySet 视图遍历" }
  ], "A,B,D", "HashSet 不保证顺序；LinkedHash* 结构通常保持插入顺序。", 3, ["集合", "顺序", "来源:Oracle Java Collections 文档"]),
  mc("关于 Spring Boot Actuator health 端点，下列哪些描述正确？", [
    { optionKey: "A", optionText: "可以查看应用整体健康状态" },
    { optionKey: "B", optionText: "可以查看某个组件的健康状态" },
    { optionKey: "C", optionText: "必须通过 POST 请求访问" },
    { optionKey: "D", optionText: "路径通常带 /actuator 前缀" }
  ], "A,B,D", "health 端点支持 GET 查看整体和组件状态。", 2, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),
  mc("关于 Spring 依赖注入，以下哪些优点常与构造器注入关联？", [
    { optionKey: "A", optionText: "依赖更显式" },
    { optionKey: "B", optionText: "更利于不可变设计" },
    { optionKey: "C", optionText: "可以完全避免循环依赖问题的设计暴露" },
    { optionKey: "D", optionText: "更利于单元测试" }
  ], "A,B,D", "构造器注入常被认为更清晰且更易测试。", 3, ["Spring", "依赖注入", "来源:Spring Framework 文档"]),
  mc("关于 Java 泛型中的通配符，下列哪些表述符合常见 PECS 原则？", [
    { optionKey: "A", optionText: "Producer Extends" },
    { optionKey: "B", optionText: "Consumer Super" },
    { optionKey: "C", optionText: "Extends 用于只读/生产者场景更常见" },
    { optionKey: "D", optionText: "Super 一定禁止写入" }
  ], "A,B,C", "PECS 是泛型边界选型的经典经验规则。", 4, ["泛型", "PECS", "来源:Oracle Java 教程"]),
  mc("关于 Spring MVC 请求映射，下列哪些注解经常直接用于处理请求？", [
    { optionKey: "A", optionText: "@GetMapping" },
    { optionKey: "B", optionText: "@PostMapping" },
    { optionKey: "C", optionText: "@RequestMapping" },
    { optionKey: "D", optionText: "@ConfigurationProperties" }
  ], "A,B,C", "前三者均用于请求映射。", 2, ["Spring MVC", "Web", "来源:Spring Framework 文档"]),
  mc("关于 Java 不可变对象，下列哪些收益通常成立？", [
    { optionKey: "A", optionText: "更易于并发共享" },
    { optionKey: "B", optionText: "状态变化可控" },
    { optionKey: "C", optionText: "一定比可变对象更省内存" },
    { optionKey: "D", optionText: "有助于降低副作用" }
  ], "A,B,D", "不可变对象不必然省内存，但有利于共享和降低副作用。", 3, ["设计", "不可变对象", "来源:Oracle Java 文档"]),
  mc("关于 Spring Boot metrics 端点，下列哪些说法正确？", [
    { optionKey: "A", optionText: "可以查看已采集指标列表" },
    { optionKey: "B", optionText: "可以对某个指标按 tag 维度钻取" },
    { optionKey: "C", optionText: "只能查看 JVM 指标，不能看应用指标" },
    { optionKey: "D", optionText: "通常位于 /actuator/metrics" }
  ], "A,B,D", "metrics 端点支持指标清单和按名称查看。", 2, ["Spring Boot", "Metrics", "来源:Spring Boot 文档"]),
  mc("关于接口与实现分离，下列哪些做法更符合 Java/Spring 常见工程实践？", [
    { optionKey: "A", optionText: "面对接口编程" },
    { optionKey: "B", optionText: "通过依赖注入切换实现" },
    { optionKey: "C", optionText: "业务代码到处直接 new 具体实现以固定依赖" },
    { optionKey: "D", optionText: "通过组合代替不必要继承" }
  ], "A,B,D", "接口与依赖注入有助于解耦。", 3, ["设计", "Spring", "来源:Spring Framework 文档"]),
  mc("关于 Spring 事务属性，下列哪些属于 TransactionDefinition 关注的方面？", [
    { optionKey: "A", optionText: "传播行为" },
    { optionKey: "B", optionText: "隔离级别" },
    { optionKey: "C", optionText: "超时时间" },
    { optionKey: "D", optionText: "read-only 标记" }
  ], "A,B,C,D", "Spring 数据访问文档明确列出这些事务属性。", 3, ["Spring", "事务", "来源:Spring Framework 数据访问文档"]),
  mc("关于 Java Stream 与集合的区别，下列哪些描述更准确？", [
    { optionKey: "A", optionText: "Stream 更偏向描述计算过程" },
    { optionKey: "B", optionText: "集合更偏向存储数据" },
    { optionKey: "C", optionText: "一个 Stream 理论上可以无限次重复消费" },
    { optionKey: "D", optionText: "Stream 支持惰性求值的中间操作" }
  ], "A,B,D", "Stream 通常是一次性消费的。", 3, ["Stream", "集合", "来源:Oracle Java 文档"]),

  tf("HashSet 的核心语义是保证元素唯一，而不是保证插入顺序。", true, "唯一性是 Set 的关键语义，顺序则与具体实现有关。", 1, ["集合", "Set", "来源:Oracle Java Collections 文档"]),
  tf("ConcurrentHashMap 适合在多线程并发访问 Map 的场景中使用。", true, "它是典型并发 Map 实现。", 2, ["并发", "ConcurrentHashMap", "来源:Oracle Java API"]),
  tf("Optional.of(null) 是安全的，不会抛出异常。", false, "Optional.of 传入 null 会抛异常，应使用 ofNullable。", 1, ["Optional", "来源:Oracle Java API"]),
  tf("Spring 中 singleton scope 表示每次 getBean 都创建一个新实例。", false, "singleton 默认在容器内共享同一个实例。", 1, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  tf("Spring Boot Actuator health 端点支持查看某个具体组件的健康状态。", true, "Actuator 文档说明支持按组件路径查看。", 2, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),
  tf("try-with-resources 可以减少 finally 中手工关闭资源的代码。", true, "这是其核心价值之一。", 1, ["异常处理", "资源管理", "来源:Oracle 异常教程"]),
  tf("volatile 能保证 i++ 这种复合操作的原子性。", false, "volatile 主要保证可见性，不保证复合操作原子性。", 3, ["并发", "volatile", "来源:Oracle 并发文档"]),
  tf("List.of 创建出来的列表默认可变。", false, "List.of 返回不可变列表。", 1, ["集合", "工厂方法", "来源:Oracle Java API"]),
  tf("Spring 声明式事务默认会对 RuntimeException 自动回滚。", true, "这是默认回滚行为。", 2, ["Spring", "事务", "来源:Spring Framework 事务文档"]),
  tf("LocalDate 同时包含日期、时间和时区三部分。", false, "LocalDate 仅表示日期。", 1, ["java.time", "来源:Oracle Java API"]),
  tf("ExecutorService.shutdownNow 与 shutdown 的语义完全相同。", false, "shutdownNow 更激进，会尝试中断任务。", 3, ["线程池", "来源:Oracle Java Concurrency 文档"]),
  tf("Bean 的 prototype scope 更适合有状态对象。", true, "Spring 文档中常建议 stateful bean 用 prototype。", 2, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  tf("Java checked exception 通常需要 catch 或在方法签名中声明。", true, "这是 catch-or-specify requirement。", 1, ["异常处理", "来源:Oracle 异常教程"]),
  tf("Map 是 Collection 的直接子接口。", false, "Map 与 Collection 属于不同层次。", 1, ["集合框架", "来源:Oracle Java Collections 文档"]),
  tf("Stream 的中间操作通常是惰性执行的。", true, "中间操作通常在终止操作触发时真正执行。", 2, ["Stream", "来源:Oracle Java 文档"]),
  tf("Spring Boot metrics 端点只能查看 JVM 指标，不能查看其他指标。", false, "Metrics 端点可查看多类指标。", 2, ["Spring Boot", "Metrics", "来源:Spring Boot 文档"]),
  tf("equals 与 hashCode 的契约对 HashMap、HashSet 等散列表容器很重要。", true, "否则可能出现定位和去重异常。", 2, ["对象模型", "来源:Oracle Java API"]),
  tf("CompletableFuture 只能阻塞式使用，无法组合后续处理阶段。", false, "它支持 thenApply、thenCompose 等组合能力。", 3, ["并发", "CompletableFuture", "来源:Oracle Java API"]),
  tf("Spring MVC 中 @ResponseBody 用于把返回值直接写入响应体。", true, "这是该注解的常见用途。", 1, ["Spring MVC", "来源:Spring Framework 文档"]),
  tf("READ_COMMITTED 的目标之一是避免读取到其他事务尚未提交的数据。", true, "这是常见隔离级别语义。", 3, ["事务", "隔离级别", "来源:Spring Framework 数据访问文档"]),

  fb("在 Java 对象相等性约定中，如果重写 equals，通常也应该重写 _______。", "hashCode", "保持 equals/hashCode 契约一致。", 2, ["对象模型", "来源:Oracle Java API"]),
  fb("在 ThreadPoolExecutor 中，_______ 表示核心线程数量。", "corePoolSize", "区分核心线程数和最大线程数。", 2, ["线程池", "来源:Oracle Java API"]),
  fb("Spring 默认的 Bean scope 是 _______。", "singleton", "默认单例作用域。", 1, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  fb("Spring Boot 默认的健康检查端点路径后缀通常是 /actuator/_______。", "health", "对应 health 端点。", 1, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),
  fb("用于把集合元素聚合成最终结果的 Stream 终止操作常见示例是 _______。", "collect", "collect 是典型聚合终止操作。", 2, ["Stream", "来源:Oracle Java 文档"]),
  fb("当变量可能为空时，创建 Optional 更稳妥的方法是 Optional._______。", "ofNullable", "避免 Optional.of(null) 抛异常。", 1, ["Optional", "来源:Oracle Java API"]),
  fb("在 Spring 事务传播中，挂起当前事务并新开一个事务的模式是 _______。", "REQUIRES_NEW", "这是典型事务传播模式。", 3, ["Spring", "事务传播", "来源:Spring Framework 文档"]),
  fb("Java 中用于声明资源在离开作用域时自动关闭的语法是 try-with-_______。", "resources", "对应 try-with-resources。", 1, ["异常处理", "来源:Oracle 异常教程"]),
  fb("用于高并发 Map 场景的 JDK 容器常见选择是 _______。", "ConcurrentHashMap", "它是常见并发 Map 实现。", 2, ["并发", "来源:Oracle Java API"]),
  fb("在 Spring MVC 中，把返回值写到响应体的常用注解是 @_______。", "ResponseBody", "与 REST 风格接口强相关。", 2, ["Spring MVC", "来源:Spring Framework 文档"]),
  fb("Java 日期时间 API 中只表示日期、不含时间和时区的类型是 _______。", "LocalDate", "LocalDate 仅表示日期。", 1, ["java.time", "来源:Oracle Java API"]),
  fb("在 Set 语义中，最核心的约束是元素 _______。", "唯一", "Set 关注去重。", 1, ["集合", "来源:Oracle Java Collections 文档"]),
  fb("Spring Bean scope 中，每次请求 Bean 都创建新实例的作用域是 _______。", "prototype", "prototype 对应多实例。", 2, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  fb("执行器平滑关闭、拒绝新任务但继续处理队列中任务的方法通常是 _______。", "shutdown", "对应 ExecutorService.shutdown。", 2, ["线程池", "来源:Oracle Java Concurrency 文档"]),
  fb("在事务隔离讨论中，读取到其他事务未提交数据的问题通常叫 _______ 读。", "脏", "对应 dirty read。", 3, ["事务", "隔离级别", "来源:Spring Framework 数据访问文档"]),
  fb("使用 Stream 按条件保留元素的中间操作名称是 _______。", "filter", "filter 用于按谓词筛选元素。", 1, ["Stream", "来源:Oracle Java 文档"]),
  fb("使用 Stream 把元素映射成另一种形态的中间操作名称是 _______。", "map", "map 用于一对一转换。", 1, ["Stream", "来源:Oracle Java 文档"]),
  fb("Spring Boot Actuator 用于查看指标明细的端点前缀通常是 /actuator/_______。", "metrics", "metrics 端点用于查看指标。", 2, ["Spring Boot", "Metrics", "来源:Spring Boot 文档"]),
  fb("Java 中 RuntimeException 属于 _______ 受检异常。", "非", "RuntimeException 是未受检异常。", 1, ["异常处理", "来源:Oracle 异常教程"]),
  fb("CompletableFuture 中，用于在前一阶段结果基础上继续转换的常用方法是 then_______。", "Apply", "thenApply 是常见转换阶段。", 3, ["并发", "CompletableFuture", "来源:Oracle Java API"]),

  sa("请说明为什么在重写 equals 的同时通常还需要重写 hashCode，并结合 HashMap 或 HashSet 说明可能出现的问题。", "重点考察对象相等性约定、散列容器行为与数据一致性认知。", 3, ["对象模型", "集合", "来源:Oracle Java API"]),
  sa("请说明 Java checked exception 与 unchecked exception 的区别，并结合服务端代码说明各自更常见的处理策略。", "考察异常分类、签名约束与工程处理习惯。", 3, ["异常处理", "来源:Oracle 异常教程"]),
  sa("请解释 Stream API 中中间操作与终止操作的区别，并说明为什么说中间操作通常是惰性的。", "考察函数式链路与执行时机。", 2, ["Stream", "来源:Oracle Java 文档"]),
  sa("请说明 Optional 在后端代码中的合理使用边界，以及为什么不建议在所有字段和集合元素上机械地套 Optional。", "考察 Optional 设计意图与工程实践判断。", 3, ["Optional", "来源:Oracle Java API"]),
  sa("请说明 ConcurrentHashMap 相对 HashMap 加外部同步在高并发场景下的优势和使用边界。", "考察并发容器选型、吞吐与锁粒度理解。", 4, ["并发", "ConcurrentHashMap", "来源:Oracle Java API"]),
  sa("请说明 volatile 适合解决什么问题，不适合解决什么问题，并举出一个典型误用案例。", "考察可见性与原子性边界。", 4, ["并发", "volatile", "来源:Oracle 并发文档"]),
  sa("请解释 Spring Bean 的 singleton 与 prototype 作用域在生命周期、资源占用和适用场景上的差异。", "考察 IoC 与 Bean scope 基础。", 2, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  sa("请说明 Spring 声明式事务默认回滚规则，以及当业务需要对 checked exception 回滚时通常如何配置。", "考察事务默认行为与 rollbackFor 使用。", 3, ["Spring", "事务", "来源:Spring Framework 事务文档"]),
  sa("请说明 ThreadPoolExecutor 中核心线程数、最大线程数、阻塞队列和拒绝策略之间的关系。", "考察线程池配置的系统理解。", 4, ["线程池", "来源:Oracle Java API"]),
  sa("请说明为什么说不可变对象更利于并发编程，并举出在 Java 后端中常见的不可变设计实践。", "考察不可变对象与并发安全。", 3, ["设计", "并发", "来源:Oracle Java 文档"]),
  sa("请解释 Spring Boot Actuator health 与 metrics 两类端点的作用差异，以及它们在生产排障中的典型用途。", "考察监控与运维基本认知。", 2, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),
  sa("请说明 Java 集合中 List、Set、Map 三类结构最核心的抽象差异，并给出各自适合的业务场景。", "考察集合框架基础与选型能力。", 2, ["集合", "来源:Oracle Java Collections 文档"]),
  sa("请说明 Spring MVC 中 @RequestMapping、@GetMapping、@PostMapping 的关系，以及在接口设计时如何选择。", "考察 Web 层注解体系理解。", 2, ["Spring MVC", "来源:Spring Framework 文档"]),
  sa("请说明事务隔离级别与并发异常之间的关系，并重点解释脏读、不可重复读、幻读各自含义。", "考察事务理论与数据库交互理解。", 4, ["事务", "隔离级别", "来源:Spring Framework 数据访问文档"]),
  sa("请解释 CompletableFuture 相比传统 Future 在异步流程编排上的主要改进点。", "考察异步编排能力与 API 设计差异。", 3, ["并发", "CompletableFuture", "来源:Oracle Java API"]),
  sa("请说明 try-with-resources 为什么比传统 finally 手动关闭资源更稳妥，并解释 suppressed exception 的意义。", "考察资源释放与异常链认知。", 4, ["异常处理", "资源管理", "来源:Oracle 异常教程"]),
  sa("请说明在 Spring 中为什么更推荐构造器注入，并分析它对可测试性和依赖治理的影响。", "考察依赖注入实践。", 3, ["Spring", "依赖注入", "来源:Spring Framework 文档"]),
  sa("请说明 Java 8 之后日期时间 API 相比旧 Date/Calendar 风格的改进点。", "考察 API 演进与工程使用习惯。", 2, ["java.time", "来源:Oracle Java API"]),
  sa("请解释为什么在招聘测评系统这类业务中，提交记录、逐题作答、评分记录通常需要分表建模。", "考察领域建模与可审计性设计。", 4, ["领域建模", "后端设计", "来源:工程实践"]),
  sa("请说明当你在代码审查中看到大量业务代码直接 new 具体实现而不是依赖接口时，会有哪些长期维护问题。", "考察解耦、测试替身和扩展性意识。", 3, ["设计原则", "Spring", "来源:工程实践"]),

  scen("你负责一个招聘测评系统的题库检索接口。随着题量增加，面试官反馈关键词搜索越来越慢。请说明你会如何定位瓶颈，并从 SQL、索引、查询条件设计和分页策略几个方面提出改进方案。", "重点考察查询优化、索引设计、分页策略与性能定位思路。", 4, ["数据库", "检索", "系统设计", "来源:工程实践"]),
  scen("某次线上笔试开始后，候选人集中登录导致健康检查仍然显示 UP，但答题接口大量超时。请结合 Actuator 的 health 与 metrics 思路，说明你会如何补充监控并定位问题。", "考察健康检查与指标监控的差异、线程池/连接池/接口耗时定位。", 4, ["Spring Boot", "Actuator", "监控", "来源:Spring Boot 文档"]),
  scen("你负责一个高并发 Java 服务，某缓存对象被多个线程频繁更新。团队里有人提议用 HashMap 加 synchronized，也有人提议用 ConcurrentHashMap。请给出你的选型分析和验证思路。", "考察并发容器选型、临界区设计与压测验证。", 4, ["并发", "缓存", "来源:Oracle Java API"]),
  scen("在试卷模板自动组卷功能中，业务要求按题型配比和总分自动选题，但生成结果经常凑不满分。请说明你会如何设计组卷算法、失败提示和人工兜底交互。", "考察组合求解、失败回退和产品化思维。", 4, ["组卷", "算法", "系统设计", "来源:工程实践"]),
  scen("你在 Spring Boot 应用中接入了数据库连接池，但在活动期间发现连接数经常打满。请说明你会如何判断是慢 SQL、连接泄漏、事务过长还是线程池堆积导致的。", "考察连接池问题拆解与根因定位。", 5, ["Spring Boot", "数据库", "排障", "来源:工程实践"]),
  scen("某招聘任务要求候选人作答时自动保存草稿。现在前端频繁保存导致后端压力很高。请说明你会如何在前后端之间设计更合理的草稿保存机制。", "考察节流、防抖、幂等、增量保存和一致性设计。", 4, ["答题系统", "系统设计", "来源:工程实践"]),
  scen("你负责一个事务型接口：创建提交记录、保存逐题答案、更新候选人状态。生产中偶发只插入了提交记录但答案没落库的情况。请说明你会如何设计事务边界和失败补偿。", "考察事务边界、幂等、补偿与状态机设计。", 5, ["事务", "系统设计", "来源:Spring Framework 事务文档"]),
  scen("面试官希望在查看答卷详情时看到最终招聘建议，但又不希望 AI 直接决定结果。请设计一套 AI 建议分、人工复核、最终招聘建议三者之间的交互与审计方案。", "考察 AI 辅助而非替代的流程设计与可审计性。", 4, ["AI 评分", "审计", "来源:工程实践"]),
  scen("一个 Spring MVC 接口在高峰期出现大量 400/500 混杂错误，日志也不统一。请说明你会如何重构参数校验、异常处理和返回结构。", "考察 Web 层治理、统一异常处理和接口契约设计。", 4, ["Spring MVC", "异常治理", "来源:Spring Framework 文档"]),
  scen("你要为招聘测评系统设计一个导出成绩单功能，要求支持分页导出、失败重试、权限控制和审计记录。请给出你的接口与任务设计方案。", "考察异步任务、权限与可追踪性设计。", 4, ["导出", "系统设计", "来源:工程实践"]),
  scen("某候选人在答题过程中多次退出全屏、页面失焦、网络离线。业务要求给出风险等级但不能简单一刀切。请说明你会如何设计风险评分模型和最终展示逻辑。", "考察风控事件建模与业务解释性。", 4, ["风控", "监考", "来源:工程实践"]),
  scen("你发现某接口为了图省事，把所有配置都做成了 prototype Bean，导致对象创建频繁、GC 压力变大。请说明你会如何评估并重构 Bean scope。", "考察 Spring Bean 生命周期、性能与资源治理。", 4, ["Spring", "Bean Scope", "来源:Spring Framework 文档"]),
  scen("如果业务要求支持多轮面试测评，但每轮都要保留完整题目、答卷、评分和推荐建议快照，你会如何设计数据模型避免历史污染？", "考察历史快照、版本化建模与关联设计。", 5, ["数据模型", "系统设计", "来源:工程实践"]),
  scen("你接手的系统里，所有定时任务和异步任务都共用一个线程池，结果在高峰期互相影响。请说明你会如何拆分线程池并建立监控。", "考察线程池隔离、容量规划和可观测性。", 4, ["线程池", "监控", "来源:Oracle Java API"]),
  scen("某次发布后，Health 端点仍然显示 UP，但核心答题链路不可用。请说明为什么会出现这种情况，以及你会如何改造健康检查策略。", "考察健康检查粒度与真实可用性的差异。", 4, ["Spring Boot", "Actuator", "来源:Spring Boot 文档"]),
  scen("你需要为自动组卷功能增加“知识点覆盖均衡”能力，避免 10 道题全是集合框架。请给出你的规则设计与算法思路。", "考察约束组卷与知识点多样性控制。", 5, ["组卷", "算法", "来源:工程实践"]),
  scen("招聘专员希望按“待审核、已审核、推荐、不推荐”快速筛提交记录，但当前列表查询越来越慢。请说明你会如何优化列表数据结构和查询接口。", "考察列表检索模型、字段冗余与分页索引优化。", 4, ["查询优化", "系统设计", "来源:工程实践"]),
  scen("你需要设计一个题目修改机制，既允许编辑草稿题，又不能影响已经被试卷模板引用或已经参与答卷的历史题目。请说明你的版本化策略。", "考察题目版本化、引用隔离和历史可追溯。", 5, ["题库", "版本控制", "来源:工程实践"]),
  scen("某业务希望在笔试结束后自动给候选人发送结果通知，但只有“已审核且最终建议已确认”的提交才能发。请说明你会如何设计触发条件和补偿机制。", "考察事件触发、状态机与通知补偿。", 4, ["通知", "状态机", "来源:工程实践"]),
  scen("一个多模块 Spring 项目中，不同模块都声明了同名 Bean，导致启动时注入歧义。请说明你会如何定位问题并给出治理方案。", "考察 Spring 容器诊断、命名治理与模块边界意识。", 4, ["Spring", "容器", "来源:Spring Framework 文档"])
];

if (BULK_QUESTION_BANK.length !== 120) {
  throw new Error(`预置题库数量异常，期望 120，实际 ${BULK_QUESTION_BANK.length}`);
}
