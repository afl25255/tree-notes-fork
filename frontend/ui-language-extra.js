(() => {
    const STORAGE_KEY = 'treenotes-ui-language';
    const EXTRA_LANGUAGES = new Set(['pt', 'ru', 'el', 'vi', 'zh', 'ja', 'ko', 'id', 'ar', 'fa', 'he', 'yi']);
    const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'yi']);
    const ALIASES = {
        'pt-br': 'pt', 'pt-pt': 'pt',
        'el-gr': 'el',
        'vi-vn': 'vi',
        'ko-kr': 'ko',
        'id-id': 'id', 'in': 'id',
        'fa-ir': 'fa', 'pes': 'fa', 'prs': 'fa',
        'yi-001': 'yi', 'ji': 'yi'
    };

    const TRANSLATIONS = {
        ru: {
            appTitle: 'Древовидные заметки', menuTitle: '📘 TreeNotes', new: 'Новый', cloudOpen: 'Открыть из облака', cloudSave: 'Сохранить в облако', localOpen: 'Открыть локально', localSave: 'Сохранить локально', toggleTheme: 'Переключить светлую/тёмную тему', aiSettings: 'Настройки ИИ', aiProvider: 'Поставщик ИИ', aiModel: 'Модель ИИ', geminiKey: 'Ключ Gemini API', openaiKey: 'Ключ OpenAI API', ollamaUrl: 'URL Ollama', backendUrl: 'URL backend API', aiHint: 'Ключи отправляются только в backend endpoint анализа и не сохраняются в файлах заметок.', proMode: 'Быстрый Pro-режим', proHint: 'Просит ИИ отдавать приоритет авторитетным академическим, научным, государственным, медицинским, юридическим и издательским источникам.', dictationSettings: 'Настройки диктовки', speechLanguage: 'Язык речи', continuousListening: 'Непрерывное прослушивание', interimRecognition: 'Использовать промежуточное распознавание', testDictation: 'Проверить диктовку', dictationHint: 'Использует распознавание речи браузера и системный микрофон.', uiLanguage: 'Язык интерфейса', uiLanguageHint: 'Меняет только подписи интерфейса; ИИ уже обрабатывает многоязычные заметки.', about: 'О программе', help: 'Справка', feedback: 'Отправить отзыв', headingPlaceholder: 'Заголовок заметки Cornell', headingColor: 'Заголовок', textColor: 'Текст', cueColumn: 'Колонка подсказок', cuePlaceholder: 'Подсказки, ключевые слова, главные вопросы', summary: 'Сводка', summaryPlaceholder: 'Введите сводку здесь...', llmInsights: 'LLM-инсайты', overview: 'Обзор', analysis: 'Анализ', concepts: 'Понятия', suggestedLinks: 'Предлагаемые связи', seeAlso: 'См. также', videos: 'Видео', cell: 'Ячейка', addBox: '+ Добавить ячейку', deleteBox: '− Удалить ячейку', duplicateBox: '* Дублировать ячейку', linkSystem: 'Система связей', openServer: 'Открыть с сервера', refresh: 'Обновить', close: 'Закрыть', helpTitle: 'Справка и инструкции', howToUse: 'Как использовать TreeNotes:', helpAddBoxes: 'Добавление ячеек:', helpAddBoxesText: 'Нажмите ➕ на панели инструментов, чтобы добавить заметку.', helpLinkBoxes: 'Связывание ячеек:', helpLinkBoxesText: 'Выберите ячейку, откройте систему связей и выберите другую ячейку.', helpAnalyzeAi: 'Анализ ИИ:', helpAnalyzeAiText: 'Нажмите 🤖, чтобы получить ИИ-инсайты по заметкам.', aboutTitle: 'О TreeNotes', feedbackTitle: 'Отправить отзыв', feedbackMessage: 'Сообщение команде разработки', feedbackPlaceholder: 'Опишите проблему, идею или workflow, который нужно улучшить.', feedbackHint: 'Эта beta-версия открывает почтовое приложение с сообщением.', openEmail: 'Открыть email', forumsDiscord: 'Форумы/Discord', languageApplied: 'Язык интерфейса обновлён.'
        },
        zh: {
            appTitle: '树状笔记', menuTitle: '📘 TreeNotes', new: '新建', cloudOpen: '从云端打开', cloudSave: '保存到云端', localOpen: '本地打开', localSave: '本地保存', toggleTheme: '切换浅色/深色模式', aiSettings: 'AI 设置', aiProvider: 'AI 提供商', aiModel: 'AI 模型', geminiKey: 'Gemini API 密钥', openaiKey: 'OpenAI API 密钥', ollamaUrl: 'Ollama URL', backendUrl: '后端 API URL', aiHint: '密钥只会发送到后端分析端点，不会保存在笔记文件中。', proMode: '快速专业模式', proHint: '让 AI 优先采用高权威的学术、科学、政府、医学、法律和出版社来源。', dictationSettings: '听写设置', speechLanguage: '语音语言', continuousListening: '连续聆听', interimRecognition: '使用临时识别', testDictation: '测试听写', dictationHint: '使用浏览器语音识别和系统麦克风。', uiLanguage: '界面语言', uiLanguageHint: '只更改界面标签；AI 已可处理多语言笔记。', about: '关于', help: '帮助', feedback: '发送反馈', headingPlaceholder: 'Cornell 笔记标题', headingColor: '标题', textColor: '文字', cueColumn: '提示栏', cuePlaceholder: '提示、关键词、关键问题', summary: '总结', summaryPlaceholder: '在此输入总结...', llmInsights: 'LLM 洞察', overview: '概览', analysis: '分析', concepts: '概念', suggestedLinks: '建议连接', seeAlso: '另请参阅', videos: '视频', cell: '单元格', addBox: '+ 添加单元格', deleteBox: '− 删除单元格', duplicateBox: '* 复制单元格', linkSystem: '连接系统', openServer: '从服务器打开', refresh: '刷新', close: '关闭', helpTitle: '帮助与说明', howToUse: '如何使用 TreeNotes：', helpAddBoxes: '添加单元格：', helpAddBoxesText: '点击工具栏中的 ➕ 添加笔记。', helpLinkBoxes: '连接单元格：', helpLinkBoxesText: '选择一个单元格，打开连接系统，然后选择另一个单元格。', helpAnalyzeAi: 'AI 分析：', helpAnalyzeAiText: '点击 🤖 获取关于笔记的 AI 洞察。', aboutTitle: '关于 TreeNotes', feedbackTitle: '发送反馈', feedbackMessage: '给开发团队的消息', feedbackPlaceholder: '描述需要改进的问题、想法或 workflow。', feedbackHint: '此 beta 版本会打开你的邮件应用并填入消息。', openEmail: '打开邮件', forumsDiscord: '论坛/Discord', languageApplied: '界面语言已更新。'
        },
        ja: {
            appTitle: 'ツリーノート', menuTitle: '📘 TreeNotes', new: '新規', cloudOpen: 'クラウドから開く', cloudSave: 'クラウドに保存', localOpen: 'ローカルから開く', localSave: 'ローカルに保存', toggleTheme: 'ライト/ダークモード切替', aiSettings: 'AI 設定', aiProvider: 'AI プロバイダー', aiModel: 'AI モデル', geminiKey: 'Gemini API キー', openaiKey: 'OpenAI API キー', ollamaUrl: 'Ollama URL', backendUrl: 'バックエンド API URL', aiHint: 'キーはバックエンド分析 endpoint にのみ送信され、ノートファイルには保存されません。', proMode: 'クイック Pro モード', proHint: 'AI に、権威ある学術、科学、政府、医療、法律、出版社の情報源を優先させます。', dictationSettings: '音声入力設定', speechLanguage: '音声言語', continuousListening: '継続リスニング', interimRecognition: '暫定認識を使用', testDictation: '音声入力をテスト', dictationHint: 'ブラウザの音声認識とシステムマイクを使用します。', uiLanguage: 'UI 言語', uiLanguageHint: 'インターフェイスのラベルのみを変更します。AI は多言語ノートを処理できます。', about: '概要', help: 'ヘルプ', feedback: 'フィードバック送信', headingPlaceholder: 'Cornell ノート見出し', headingColor: '見出し', textColor: 'テキスト', cueColumn: 'キュー列', cuePlaceholder: 'キュー、キーワード、重要な質問', summary: '要約', summaryPlaceholder: 'ここに要約を入力...', llmInsights: 'LLM インサイト', overview: '概要', analysis: '分析', concepts: '概念', suggestedLinks: '推奨リンク', seeAlso: '関連項目', videos: '動画', cell: 'セル', addBox: '+ セルを追加', deleteBox: '− セルを削除', duplicateBox: '* セルを複製', linkSystem: 'リンクシステム', openServer: 'サーバーから開く', refresh: '更新', close: '閉じる', helpTitle: 'ヘルプと手順', howToUse: 'TreeNotes の使い方：', helpAddBoxes: 'セルを追加：', helpAddBoxesText: 'ツールバーの ➕ をクリックしてノートを追加します。', helpLinkBoxes: 'セルをリンク：', helpLinkBoxesText: 'セルを選択し、リンクシステムを開いて別のセルを選択します。', helpAnalyzeAi: 'AI 分析：', helpAnalyzeAiText: '🤖 をクリックしてノートの AI インサイトを取得します。', aboutTitle: 'TreeNotes について', feedbackTitle: 'フィードバック送信', feedbackMessage: '開発チームへのメッセージ', feedbackPlaceholder: '改善したい問題、アイデア、workflow を説明してください。', feedbackHint: 'この beta はメッセージ付きでメールアプリを開きます。', openEmail: 'メールを開く', forumsDiscord: 'フォーラム/Discord', languageApplied: 'インターフェイス言語を更新しました。'
        },
        ar: {
            appTitle: 'ملاحظات شجرية', menuTitle: '📘 TreeNotes', new: 'جديد', cloudOpen: 'فتح من السحابة', cloudSave: 'حفظ في السحابة', localOpen: 'فتح محلي', localSave: 'حفظ محلي', toggleTheme: 'تبديل الوضع الفاتح/الداكن', aiSettings: 'إعدادات الذكاء الاصطناعي', aiProvider: 'مزود الذكاء الاصطناعي', aiModel: 'نموذج الذكاء الاصطناعي', geminiKey: 'مفتاح Gemini API', openaiKey: 'مفتاح OpenAI API', ollamaUrl: 'عنوان Ollama', backendUrl: 'عنوان API الخلفية', aiHint: 'تُرسل المفاتيح فقط إلى endpoint التحليل في الخلفية ولا تُحفظ داخل ملفات الملاحظات.', proMode: 'وضع Pro سريع', proHint: 'يوجه الذكاء الاصطناعي لإعطاء الأولوية لمصادر أكاديمية وعلمية وحكومية وطبية وقانونية وناشرين موثوقين.', dictationSettings: 'إعدادات الإملاء', speechLanguage: 'لغة الكلام', continuousListening: 'استماع مستمر', interimRecognition: 'استخدام التعرف المؤقت', testDictation: 'اختبار الإملاء', dictationHint: 'يستخدم التعرف على الكلام في المتصفح وميكروفون النظام.', uiLanguage: 'لغة الواجهة', uiLanguageHint: 'يغير تسميات الواجهة فقط؛ يستطيع الذكاء الاصطناعي معالجة الملاحظات متعددة اللغات.', about: 'حول', help: 'مساعدة', feedback: 'إرسال ملاحظات', headingPlaceholder: 'عنوان ملاحظة Cornell', headingColor: 'العنوان', textColor: 'النص', cueColumn: 'عمود التلميحات', cuePlaceholder: 'تلميحات، كلمات مفتاحية، أسئلة رئيسية', summary: 'ملخص', summaryPlaceholder: 'اكتب الملخص هنا...', llmInsights: 'رؤى LLM', overview: 'نظرة عامة', analysis: 'تحليل', concepts: 'مفاهيم', suggestedLinks: 'روابط مقترحة', seeAlso: 'انظر أيضًا', videos: 'فيديوهات', cell: 'خلية', addBox: '+ إضافة خلية', deleteBox: '− حذف خلية', duplicateBox: '* تكرار خلية', linkSystem: 'نظام الروابط', openServer: 'فتح من الخادم', refresh: 'تحديث', close: 'إغلاق', helpTitle: 'مساعدة وتعليمات', howToUse: 'كيفية استخدام TreeNotes:', helpAddBoxes: 'إضافة خلايا:', helpAddBoxesText: 'انقر ➕ في شريط الأدوات لإضافة ملاحظة.', helpLinkBoxes: 'ربط الخلايا:', helpLinkBoxesText: 'اختر خلية، وافتح نظام الروابط، ثم اختر خلية أخرى.', helpAnalyzeAi: 'تحليل AI:', helpAnalyzeAiText: 'انقر 🤖 للحصول على رؤى AI حول ملاحظاتك.', aboutTitle: 'حول TreeNotes', feedbackTitle: 'إرسال ملاحظات', feedbackMessage: 'رسالة إلى فريق التطوير', feedbackPlaceholder: 'صف المشكلة أو الفكرة أو workflow الذي تريد تحسينه.', feedbackHint: 'يفتح هذا الإصدار beta تطبيق البريد الإلكتروني مع الرسالة.', openEmail: 'فتح البريد', forumsDiscord: 'المنتديات/Discord', languageApplied: 'تم تحديث لغة الواجهة.'
        },
        he: {
            appTitle: 'הערות עץ', menuTitle: '📘 TreeNotes', new: 'חדש', cloudOpen: 'פתיחה מהענן', cloudSave: 'שמירה בענן', localOpen: 'פתיחה מקומית', localSave: 'שמירה מקומית', toggleTheme: 'החלפת מצב בהיר/כהה', aiSettings: 'הגדרות AI', aiProvider: 'ספק AI', aiModel: 'מודל AI', geminiKey: 'מפתח Gemini API', openaiKey: 'מפתח OpenAI API', ollamaUrl: 'כתובת Ollama', backendUrl: 'כתובת API אחורי', aiHint: 'המפתחות נשלחים רק ל-endpoint הניתוח בשרת ואינם נשמרים בקובצי ההערות.', proMode: 'מצב Pro מהיר', proHint: 'מורה ל-AI לתעדף מקורות אקדמיים, מדעיים, ממשלתיים, רפואיים, משפטיים והוצאות לאור סמכותיים.', dictationSettings: 'הגדרות הכתבה', speechLanguage: 'שפת דיבור', continuousListening: 'האזנה רציפה', interimRecognition: 'שימוש בזיהוי ביניים', testDictation: 'בדיקת הכתבה', dictationHint: 'משתמש בזיהוי הדיבור של הדפדפן ובמיקרופון המערכת.', uiLanguage: 'שפת ממשק', uiLanguageHint: 'משנה רק את תוויות הממשק; AI כבר מטפל בהערות רב-לשוניות.', about: 'אודות', help: 'עזרה', feedback: 'שליחת משוב', headingPlaceholder: 'כותרת הערת Cornell', headingColor: 'כותרת', textColor: 'טקסט', cueColumn: 'עמודת רמזים', cuePlaceholder: 'רמזים, מילות מפתח, שאלות מרכזיות', summary: 'סיכום', summaryPlaceholder: 'הקלד את הסיכום כאן...', llmInsights: 'תובנות LLM', overview: 'סקירה', analysis: 'ניתוח', concepts: 'מושגים', suggestedLinks: 'קישורים מוצעים', seeAlso: 'ראו גם', videos: 'סרטונים', cell: 'תא', addBox: '+ הוספת תא', deleteBox: '− מחיקת תא', duplicateBox: '* שכפול תא', linkSystem: 'מערכת קישורים', openServer: 'פתיחה מהשרת', refresh: 'רענון', close: 'סגירה', helpTitle: 'עזרה והוראות', howToUse: 'איך להשתמש ב-TreeNotes:', helpAddBoxes: 'הוספת תאים:', helpAddBoxesText: 'לחץ על ➕ בסרגל הכלים כדי להוסיף הערה.', helpLinkBoxes: 'קישור תאים:', helpLinkBoxesText: 'בחר תא, פתח את מערכת הקישורים ובחר תא אחר.', helpAnalyzeAi: 'ניתוח AI:', helpAnalyzeAiText: 'לחץ על 🤖 כדי לקבל תובנות AI על ההערות שלך.', aboutTitle: 'אודות TreeNotes', feedbackTitle: 'שליחת משוב', feedbackMessage: 'הודעה לצוות הפיתוח', feedbackPlaceholder: 'תאר את הבעיה, הרעיון או ה-workflow שברצונך לשפר.', feedbackHint: 'גרסת beta זו פותחת את אפליקציית הדוא״ל עם ההודעה.', openEmail: 'פתיחת דוא״ל', forumsDiscord: 'פורומים/Discord', languageApplied: 'שפת הממשק עודכנה.'
        },
        pt: {
            appTitle: 'Notas em Árvore', menuTitle: '📘 TreeNotes', new: 'Novo', cloudOpen: 'Abrir da nuvem', cloudSave: 'Salvar na nuvem', localOpen: 'Abrir localmente', localSave: 'Salvar localmente', toggleTheme: 'Alternar modo claro/escuro', aiSettings: 'Configurações de IA', aiProvider: 'Provedor de IA', aiModel: 'Modelo de IA', geminiKey: 'Chave API Gemini', openaiKey: 'Chave API OpenAI', ollamaUrl: 'URL do Ollama', backendUrl: 'URL da API backend', aiHint: 'As chaves são enviadas apenas ao endpoint de análise do backend e não são salvas nos arquivos de notas.', proMode: 'Modo Pro rápido', proHint: 'Instrui a IA a priorizar fontes acadêmicas, científicas, governamentais, médicas, jurídicas e editoriais de alta autoridade.', dictationSettings: 'Configurações de ditado', speechLanguage: 'Idioma da fala', continuousListening: 'Escuta contínua', interimRecognition: 'Usar reconhecimento intermediário', testDictation: 'Testar ditado', dictationHint: 'Usa o reconhecimento de fala do navegador e o microfone do sistema.', uiLanguage: 'Idioma da interface', uiLanguageHint: 'Altera apenas os rótulos da interface; a IA já lida com notas multilíngues.', about: 'Sobre', help: 'Ajuda', feedback: 'Enviar feedback', headingPlaceholder: 'Título da nota Cornell', headingColor: 'Cabeçalho', textColor: 'Texto', cueColumn: 'Coluna de pistas', cuePlaceholder: 'Pistas, palavras-chave, perguntas-chave', summary: 'Resumo', summaryPlaceholder: 'Digite seu resumo aqui...', llmInsights: 'Insights do LLM', overview: 'Visão geral', analysis: 'Análise', concepts: 'Conceitos', suggestedLinks: 'Links sugeridos', seeAlso: 'Veja também', videos: 'Vídeos', cell: 'Célula', addBox: '+ Adicionar célula', deleteBox: '− Excluir célula', duplicateBox: '* Duplicar célula', linkSystem: 'Sistema de links', openServer: 'Abrir do servidor', refresh: 'Atualizar', close: 'Fechar', helpTitle: 'Ajuda e instruções', howToUse: 'Como usar o TreeNotes:', helpAddBoxes: 'Adicionar células:', helpAddBoxesText: 'Clique em ➕ na barra de ferramentas para adicionar uma nota.', helpLinkBoxes: 'Vincular células:', helpLinkBoxesText: 'Selecione uma célula, abra o sistema de links e escolha outra célula.', helpAnalyzeAi: 'Análise de IA:', helpAnalyzeAiText: 'Clique em 🤖 para obter insights de IA sobre suas notas.', aboutTitle: 'Sobre o TreeNotes', feedbackTitle: 'Enviar feedback', feedbackMessage: 'Mensagem para a equipe de desenvolvimento', feedbackPlaceholder: 'Descreva o problema, ideia ou fluxo que deseja melhorar.', feedbackHint: 'Esta versão beta abre seu aplicativo de e-mail com a mensagem.', openEmail: 'Abrir e-mail', forumsDiscord: 'Fóruns/Discord', languageApplied: 'Idioma da interface atualizado.'
        },
        el: {
            appTitle: 'Δενδρικές Σημειώσεις', menuTitle: '📘 TreeNotes', new: 'Νέο', cloudOpen: 'Άνοιγμα από cloud', cloudSave: 'Αποθήκευση στο cloud', localOpen: 'Τοπικό άνοιγμα', localSave: 'Τοπική αποθήκευση', toggleTheme: 'Εναλλαγή φωτεινού/σκοτεινού', aiSettings: 'Ρυθμίσεις AI', aiProvider: 'Πάροχος AI', aiModel: 'Μοντέλο AI', geminiKey: 'Κλειδί Gemini API', openaiKey: 'Κλειδί OpenAI API', ollamaUrl: 'URL Ollama', backendUrl: 'URL backend API', aiHint: 'Τα κλειδιά αποστέλλονται μόνο στο endpoint ανάλυσης backend και δεν αποθηκεύονται στα αρχεία σημειώσεων.', proMode: 'Γρήγορη λειτουργία Pro', proHint: 'Ζητά από την AI να προτεραιοποιεί αξιόπιστες ακαδημαϊκές, επιστημονικές, κυβερνητικές, ιατρικές, νομικές και εκδοτικές πηγές.', dictationSettings: 'Ρυθμίσεις υπαγόρευσης', speechLanguage: 'Γλώσσα ομιλίας', continuousListening: 'Συνεχής ακρόαση', interimRecognition: 'Χρήση ενδιάμεσης αναγνώρισης', testDictation: 'Δοκιμή υπαγόρευσης', dictationHint: 'Χρησιμοποιεί την αναγνώριση ομιλίας του προγράμματος περιήγησης και το μικρόφωνο συστήματος.', uiLanguage: 'Γλώσσα διεπαφής', uiLanguageHint: 'Αλλάζει μόνο τις ετικέτες της διεπαφής· η AI ήδη χειρίζεται πολύγλωσσες σημειώσεις.', about: 'Σχετικά', help: 'Βοήθεια', feedback: 'Αποστολή σχολίων', headingPlaceholder: 'Τίτλος σημείωσης Cornell', headingColor: 'Κεφαλίδα', textColor: 'Κείμενο', cueColumn: 'Στήλη ενδείξεων', cuePlaceholder: 'Ενδείξεις, λέξεις-κλειδιά, βασικές ερωτήσεις', summary: 'Σύνοψη', summaryPlaceholder: 'Πληκτρολογήστε τη σύνοψή σας εδώ...', llmInsights: 'LLM πληροφορίες', overview: 'Επισκόπηση', analysis: 'Ανάλυση', concepts: 'Έννοιες', suggestedLinks: 'Προτεινόμενοι σύνδεσμοι', seeAlso: 'Δείτε επίσης', videos: 'Βίντεο', cell: 'Κελί', addBox: '+ Προσθήκη κελιού', deleteBox: '− Διαγραφή κελιού', duplicateBox: '* Διπλότυπο κελί', linkSystem: 'Σύστημα συνδέσμων', openServer: 'Άνοιγμα από διακομιστή', refresh: 'Ανανέωση', close: 'Κλείσιμο', helpTitle: 'Βοήθεια και οδηγίες', howToUse: 'Πώς να χρησιμοποιήσετε το TreeNotes:', helpAddBoxes: 'Προσθήκη κελιών:', helpAddBoxesText: 'Κάντε κλικ στο ➕ στη γραμμή εργαλείων για να προσθέσετε σημείωση.', helpLinkBoxes: 'Σύνδεση κελιών:', helpLinkBoxesText: 'Επιλέξτε ένα κελί, ανοίξτε το σύστημα συνδέσμων και επιλέξτε άλλο κελί.', helpAnalyzeAi: 'Ανάλυση AI:', helpAnalyzeAiText: 'Κάντε κλικ στο 🤖 για AI πληροφορίες σχετικά με τις σημειώσεις σας.', aboutTitle: 'Σχετικά με το TreeNotes', feedbackTitle: 'Αποστολή σχολίων', feedbackMessage: 'Μήνυμα προς την ομάδα ανάπτυξης', feedbackPlaceholder: 'Περιγράψτε το πρόβλημα, την ιδέα ή τη ροή εργασίας που θέλετε να βελτιωθεί.', feedbackHint: 'Αυτή η beta ανοίγει την εφαρμογή email σας με το μήνυμα.', openEmail: 'Άνοιγμα email', forumsDiscord: 'Φόρουμ/Discord', languageApplied: 'Η γλώσσα διεπαφής ενημερώθηκε.'
        },
        vi: {
            appTitle: 'Ghi chú dạng cây', menuTitle: '📘 TreeNotes', new: 'Mới', cloudOpen: 'Mở từ đám mây', cloudSave: 'Lưu lên đám mây', localOpen: 'Mở cục bộ', localSave: 'Lưu cục bộ', toggleTheme: 'Chuyển sáng/tối', aiSettings: 'Cài đặt AI', aiProvider: 'Nhà cung cấp AI', aiModel: 'Mô hình AI', geminiKey: 'Khóa API Gemini', openaiKey: 'Khóa API OpenAI', ollamaUrl: 'URL Ollama', backendUrl: 'URL API backend', aiHint: 'Khóa chỉ được gửi đến endpoint phân tích backend, không được lưu trong tệp ghi chú.', proMode: 'Chế độ Pro nhanh', proHint: 'Yêu cầu AI ưu tiên nguồn học thuật, khoa học, chính phủ, y tế, pháp lý và nhà xuất bản có uy tín cao.', dictationSettings: 'Cài đặt đọc chính tả', speechLanguage: 'Ngôn ngữ giọng nói', continuousListening: 'Nghe liên tục', interimRecognition: 'Dùng nhận dạng tạm thời', testDictation: 'Thử đọc chính tả', dictationHint: 'Dùng nhận dạng giọng nói của trình duyệt và micro hệ thống.', uiLanguage: 'Ngôn ngữ giao diện', uiLanguageHint: 'Chỉ thay đổi nhãn giao diện; AI đã xử lý ghi chú đa ngôn ngữ.', about: 'Giới thiệu', help: 'Trợ giúp', feedback: 'Gửi phản hồi', headingPlaceholder: 'Tiêu đề ghi chú Cornell', headingColor: 'Tiêu đề', textColor: 'Văn bản', cueColumn: 'Cột gợi ý', cuePlaceholder: 'Gợi ý, từ khóa, câu hỏi chính', summary: 'Tóm tắt', summaryPlaceholder: 'Nhập tóm tắt tại đây...', llmInsights: 'Thông tin LLM', overview: 'Tổng quan', analysis: 'Phân tích', concepts: 'Khái niệm', suggestedLinks: 'Liên kết đề xuất', seeAlso: 'Xem thêm', videos: 'Video', cell: 'Ô', addBox: '+ Thêm ô', deleteBox: '− Xóa ô', duplicateBox: '* Nhân đôi ô', linkSystem: 'Hệ thống liên kết', openServer: 'Mở từ máy chủ', refresh: 'Làm mới', close: 'Đóng', helpTitle: 'Trợ giúp & hướng dẫn', howToUse: 'Cách dùng TreeNotes:', helpAddBoxes: 'Thêm ô:', helpAddBoxesText: 'Nhấp ➕ trên thanh công cụ để thêm ghi chú.', helpLinkBoxes: 'Liên kết ô:', helpLinkBoxesText: 'Chọn một ô, mở hệ thống liên kết rồi chọn ô khác.', helpAnalyzeAi: 'Phân tích AI:', helpAnalyzeAiText: 'Nhấp 🤖 để nhận thông tin AI về ghi chú.', aboutTitle: 'Giới thiệu TreeNotes', feedbackTitle: 'Gửi phản hồi', feedbackMessage: 'Tin nhắn cho nhóm phát triển', feedbackPlaceholder: 'Mô tả vấn đề, ý tưởng hoặc quy trình muốn cải thiện.', feedbackHint: 'Bản beta này mở ứng dụng email với nội dung tin nhắn.', openEmail: 'Mở email', forumsDiscord: 'Diễn đàn/Discord', languageApplied: 'Đã cập nhật ngôn ngữ giao diện.'
        },
        ko: {
            appTitle: '트리 노트', menuTitle: '📘 TreeNotes', new: '새로 만들기', cloudOpen: '클라우드에서 열기', cloudSave: '클라우드 저장', localOpen: '로컬 열기', localSave: '로컬 저장', toggleTheme: '라이트/다크 모드 전환', aiSettings: 'AI 설정', aiProvider: 'AI 제공자', aiModel: 'AI 모델', geminiKey: 'Gemini API 키', openaiKey: 'OpenAI API 키', ollamaUrl: 'Ollama URL', backendUrl: '백엔드 API URL', aiHint: '키는 백엔드 분석 endpoint로만 전송되며 노트 파일에는 저장되지 않습니다.', proMode: '빠른 Pro 모드', proHint: 'AI가 권위 있는 학술, 과학, 정부, 의료, 법률 및 출판사 출처를 우선하도록 합니다.', dictationSettings: '받아쓰기 설정', speechLanguage: '음성 언어', continuousListening: '연속 듣기', interimRecognition: '임시 인식 사용', testDictation: '받아쓰기 테스트', dictationHint: '브라우저 음성 인식과 시스템 마이크를 사용합니다.', uiLanguage: 'UI 언어', uiLanguageHint: '인터페이스 라벨만 변경합니다. AI는 이미 다국어 노트를 처리할 수 있습니다.', about: '정보', help: '도움말', feedback: '피드백 보내기', headingPlaceholder: 'Cornell 노트 제목', headingColor: '제목', textColor: '텍스트', cueColumn: '단서 열', cuePlaceholder: '단서, 핵심어, 핵심 질문', summary: '요약', summaryPlaceholder: '여기에 요약을 입력하세요...', llmInsights: 'LLM 인사이트', overview: '개요', analysis: '분석', concepts: '개념', suggestedLinks: '추천 링크', seeAlso: '참고 항목', videos: '동영상', cell: '셀', addBox: '+ 셀 추가', deleteBox: '− 셀 삭제', duplicateBox: '* 셀 복제', linkSystem: '링크 시스템', openServer: '서버에서 열기', refresh: '새로 고침', close: '닫기', helpTitle: '도움말 및 안내', howToUse: 'TreeNotes 사용 방법:', helpAddBoxes: '셀 추가:', helpAddBoxesText: '도구 모음에서 ➕를 클릭하여 노트를 추가하세요.', helpLinkBoxes: '셀 연결:', helpLinkBoxesText: '셀을 선택하고 링크 시스템을 연 다음 다른 셀을 선택하세요.', helpAnalyzeAi: 'AI 분석:', helpAnalyzeAiText: '🤖를 클릭하여 노트에 대한 AI 인사이트를 받으세요.', aboutTitle: 'TreeNotes 정보', feedbackTitle: '피드백 보내기', feedbackMessage: '개발팀에 보낼 메시지', feedbackPlaceholder: '개선할 문제, 아이디어 또는 workflow를 설명하세요.', feedbackHint: '이 beta는 메시지와 함께 이메일 앱을 엽니다.', openEmail: '이메일 열기', forumsDiscord: '포럼/Discord', languageApplied: '인터페이스 언어가 업데이트되었습니다.'
        },
        id: {
            appTitle: 'Catatan Pohon', menuTitle: '📘 TreeNotes', new: 'Baru', cloudOpen: 'Buka dari cloud', cloudSave: 'Simpan ke cloud', localOpen: 'Buka lokal', localSave: 'Simpan lokal', toggleTheme: 'Alihkan mode terang/gelap', aiSettings: 'Pengaturan AI', aiProvider: 'Penyedia AI', aiModel: 'Model AI', geminiKey: 'Kunci API Gemini', openaiKey: 'Kunci API OpenAI', ollamaUrl: 'URL Ollama', backendUrl: 'URL API backend', aiHint: 'Kunci hanya dikirim ke endpoint analisis backend dan tidak disimpan dalam file catatan.', proMode: 'Mode Pro cepat', proHint: 'Meminta AI memprioritaskan sumber akademik, ilmiah, pemerintah, medis, hukum, dan penerbit yang bereputasi tinggi.', dictationSettings: 'Pengaturan dikte', speechLanguage: 'Bahasa suara', continuousListening: 'Mendengarkan terus-menerus', interimRecognition: 'Gunakan pengenalan sementara', testDictation: 'Tes dikte', dictationHint: 'Menggunakan pengenalan suara browser dan mikrofon sistem.', uiLanguage: 'Bahasa UI', uiLanguageHint: 'Hanya mengubah label antarmuka; AI sudah dapat menangani catatan multibahasa.', about: 'Tentang', help: 'Bantuan', feedback: 'Kirim masukan', headingPlaceholder: 'Judul catatan Cornell', headingColor: 'Judul', textColor: 'Teks', cueColumn: 'Kolom petunjuk', cuePlaceholder: 'Petunjuk, kata kunci, pertanyaan utama', summary: 'Ringkasan', summaryPlaceholder: 'Ketik ringkasan Anda di sini...', llmInsights: 'Wawasan LLM', overview: 'Gambaran umum', analysis: 'Analisis', concepts: 'Konsep', suggestedLinks: 'Tautan yang disarankan', seeAlso: 'Lihat juga', videos: 'Video', cell: 'Sel', addBox: '+ Tambah sel', deleteBox: '− Hapus sel', duplicateBox: '* Duplikat sel', linkSystem: 'Sistem tautan', openServer: 'Buka dari server', refresh: 'Segarkan', close: 'Tutup', helpTitle: 'Bantuan & instruksi', howToUse: 'Cara menggunakan TreeNotes:', helpAddBoxes: 'Tambah sel:', helpAddBoxesText: 'Klik ➕ di toolbar untuk menambah catatan.', helpLinkBoxes: 'Tautkan sel:', helpLinkBoxesText: 'Pilih sel, buka sistem tautan, lalu pilih sel lain.', helpAnalyzeAi: 'Analisis AI:', helpAnalyzeAiText: 'Klik 🤖 untuk mendapatkan wawasan AI tentang catatan Anda.', aboutTitle: 'Tentang TreeNotes', feedbackTitle: 'Kirim masukan', feedbackMessage: 'Pesan untuk tim pengembang', feedbackPlaceholder: 'Jelaskan masalah, ide, atau workflow yang ingin ditingkatkan.', feedbackHint: 'Beta ini membuka aplikasi email Anda dengan pesan tersebut.', openEmail: 'Buka email', forumsDiscord: 'Forum/Discord', languageApplied: 'Bahasa antarmuka diperbarui.'
        },
        fa: {
            appTitle: 'یادداشت‌های درختی', menuTitle: '📘 TreeNotes', new: 'جدید', cloudOpen: 'باز کردن از ابر', cloudSave: 'ذخیره در ابر', localOpen: 'باز کردن محلی', localSave: 'ذخیره محلی', toggleTheme: 'تغییر حالت روشن/تاریک', aiSettings: 'تنظیمات هوش مصنوعی', aiProvider: 'ارائه‌دهنده هوش مصنوعی', aiModel: 'مدل هوش مصنوعی', geminiKey: 'کلید Gemini API', openaiKey: 'کلید OpenAI API', ollamaUrl: 'نشانی Ollama', backendUrl: 'نشانی API بک‌اند', aiHint: 'کلیدها فقط به endpoint تحلیل بک‌اند ارسال می‌شوند و در فایل‌های یادداشت ذخیره نمی‌شوند.', proMode: 'حالت Pro سریع', proHint: 'از هوش مصنوعی می‌خواهد منابع دانشگاهی، علمی، دولتی، پزشکی، حقوقی و ناشران معتبر را در اولویت بگذارد.', dictationSettings: 'تنظیمات گفتار به متن', speechLanguage: 'زبان گفتار', continuousListening: 'گوش دادن پیوسته', interimRecognition: 'استفاده از تشخیص موقت', testDictation: 'آزمایش گفتار', dictationHint: 'از تشخیص گفتار مرورگر و میکروفون سیستم استفاده می‌کند.', uiLanguage: 'زبان رابط', uiLanguageHint: 'فقط برچسب‌های رابط را تغییر می‌دهد؛ هوش مصنوعی از قبل یادداشت‌های چندزبانه را پشتیبانی می‌کند.', about: 'درباره', help: 'راهنما', feedback: 'ارسال بازخورد', headingPlaceholder: 'عنوان یادداشت کورنل', headingColor: 'سربرگ', textColor: 'متن', cueColumn: 'ستون سرنخ‌ها', cuePlaceholder: 'سرنخ‌ها، کلیدواژه‌ها، پرسش‌های اصلی', summary: 'خلاصه', summaryPlaceholder: 'خلاصه خود را اینجا بنویسید...', llmInsights: 'بینش‌های LLM', overview: 'نمای کلی', analysis: 'تحلیل', concepts: 'مفاهیم', suggestedLinks: 'پیوندهای پیشنهادی', seeAlso: 'همچنین ببینید', videos: 'ویدئوها', cell: 'سلول', addBox: '+ افزودن سلول', deleteBox: '− حذف سلول', duplicateBox: '* تکثیر سلول', linkSystem: 'سیستم پیوند', openServer: 'باز کردن از سرور', refresh: 'تازه‌سازی', close: 'بستن', helpTitle: 'راهنما و دستورالعمل‌ها', howToUse: 'نحوه استفاده از TreeNotes:', helpAddBoxes: 'افزودن سلول‌ها:', helpAddBoxesText: 'برای افزودن یادداشت روی ➕ در نوار ابزار کلیک کنید.', helpLinkBoxes: 'پیوند دادن سلول‌ها:', helpLinkBoxesText: 'یک سلول را انتخاب کنید، سیستم پیوند را باز کنید و سلول دیگری را برگزینید.', helpAnalyzeAi: 'تحلیل هوش مصنوعی:', helpAnalyzeAiText: 'برای دریافت بینش‌های AI درباره یادداشت‌ها روی 🤖 کلیک کنید.', aboutTitle: 'درباره TreeNotes', feedbackTitle: 'ارسال بازخورد', feedbackMessage: 'پیام برای تیم توسعه', feedbackPlaceholder: 'مشکل، ایده یا workflow مورد نظر برای بهبود را توضیح دهید.', feedbackHint: 'این نسخه beta برنامه ایمیل شما را با پیام باز می‌کند.', openEmail: 'باز کردن ایمیل', forumsDiscord: 'انجمن‌ها/Discord', languageApplied: 'زبان رابط به‌روزرسانی شد.'
        },
        yi: {
            appTitle: 'בוים־נאָטיצן', menuTitle: '📘 TreeNotes', new: 'נײַ', cloudOpen: 'עפֿענען פֿון וואָלקן', cloudSave: 'אויפֿהיטן אין וואָלקן', localOpen: 'עפֿענען לאָקאַל', localSave: 'אויפֿהיטן לאָקאַל', toggleTheme: 'בייטן ליכט/טונקל מאָדוס', aiSettings: 'AI אײַנשטעלונגען', aiProvider: 'AI צושטעלער', aiModel: 'AI מאָדעל', geminiKey: 'Gemini API שליסל', openaiKey: 'OpenAI API שליסל', ollamaUrl: 'Ollama URL', backendUrl: 'Backend API URL', aiHint: 'שליסלען ווערן געשיקט נאָר צום backend אַנאַליז endpoint און ווערן נישט אויפֿגעהיט אין נאָטיץ־טעקעס.', proMode: 'שנעלער Pro מאָדוס', proHint: 'זאָגט דעם AI צו פּריאָריטיזירן הויכ־אויטאָריטעטדיקע אַקאַדעמישע, וויסנשאַפֿטלעכע, רעגירונג, מעדיצינישע, לעגאַלע און פֿאַרלאַג־קוואַלן.', dictationSettings: 'דיקטאַציע אײַנשטעלונגען', speechLanguage: 'רעדע שפּראַך', continuousListening: 'קעסיידערדיק הערן', interimRecognition: 'ניצן צווישן־דערקענונג', testDictation: 'פּרובירן דיקטאַציע', dictationHint: 'ניצט בלעטערער רעדע־דערקענונג און דעם סיסטעם מיקראָפֿאָן.', uiLanguage: 'UI שפּראַך', uiLanguageHint: 'בייט נאָר די צעטלען פֿון דער צובינד; AI קען שוין באַהאַנדלען מאַלטילינגוואַל נאָטיצן.', about: 'וועגן', help: 'הילף', feedback: 'שיקן באַמערקונגען', headingPlaceholder: 'Cornell נאָטיץ קעפּל', headingColor: 'קעפּל', textColor: 'טעקסט', cueColumn: 'רמזים־זייַל', cuePlaceholder: 'רמזים, שליסלווערטער, הויפּט־פֿראַגעס', summary: 'קיצור', summaryPlaceholder: 'שרייבט אײַער קיצור דאָ...', llmInsights: 'LLM איינזיכטן', overview: 'איבערבליק', analysis: 'אַנאַליז', concepts: 'באַגריפֿן', suggestedLinks: 'פֿאָרגעלייגטע לינקס', seeAlso: 'זעט אויך', videos: 'ווידעאָס', cell: 'צעל', addBox: '+ צולייגן צעל', deleteBox: '− אויסמעקן צעל', duplicateBox: '* דופּליקירן צעל', linkSystem: 'לינק־סיסטעם', openServer: 'עפֿענען פֿון סערווער', refresh: 'דערפרישן', close: 'שליסן', helpTitle: 'הילף און אינסטרוקציעס', howToUse: 'ווי צו נוצן TreeNotes:', helpAddBoxes: 'צולייגן צעלן:', helpAddBoxesText: 'קוועטשן ➕ אין דער מכשיר־לײַסט צו צולייגן אַ נאָטיץ.', helpLinkBoxes: 'פֿאַרבינדן צעלן:', helpLinkBoxesText: 'קלײַבט אַ צעל, עפֿנט דעם לינק־סיסטעם און קלײַבט אַן אַנדער צעל.', helpAnalyzeAi: 'AI אַנאַליז:', helpAnalyzeAiText: 'קוועטשן 🤖 צו באַקומען AI איינזיכטן וועגן אײַערע נאָטיצן.', aboutTitle: 'וועגן TreeNotes', feedbackTitle: 'שיקן באַמערקונגען', feedbackMessage: 'אָנזאָג צום אַנטוויקלונג־טים', feedbackPlaceholder: 'באַשרײַבט דעם פּראָבלעם, געדאַנק אָדער workflow וואָס איר ווילט פֿאַרבעסערן.', feedbackHint: 'די beta עפֿנט אײַער אימעיל־אַפּ מיטן אָנזאָג.', openEmail: 'עפֿענען אימעיל', forumsDiscord: 'פֿאָרומען/Discord', languageApplied: 'די צובינד־שפּראַך איז דערהייַנטיקט.'
        }
    };

    const TOOL_TITLES = {
        ru: ['Добавить ячейку', 'Увеличить', 'Уменьшить', 'Переключить сетку', 'Переключить диктовку', 'Анализировать через API', 'Coach-режим: учебный тест', 'Скачать заметки', 'Загрузить заметки', 'Информация о заметке'],
        zh: ['添加单元格', '放大', '缩小', '切换参考网格', '切换听写', '通过 API 分析笔记', 'Coach 模式学习测验', '下载笔记', '上传笔记', '笔记信息'],
        ja: ['セルを追加', '拡大', '縮小', 'ガイドグリッド切替', '音声入力切替', 'APIでノートを分析', 'Coachモード学習クイズ', 'ノートをダウンロード', 'ノートをアップロード', 'ノート情報'],
        ar: ['إضافة خلية', 'تكبير', 'تصغير', 'تبديل شبكة الإرشاد', 'تبديل الإملاء', 'تحليل الملاحظات عبر API', 'وضع Coach: اختبار دراسة', 'تنزيل الملاحظات', 'رفع الملاحظات', 'معلومات الملاحظة'],
        he: ['הוספת תא', 'התקרבות', 'התרחקות', 'החלפת רשת עזר', 'החלפת הכתבה', 'ניתוח הערות דרך API', 'מצב Coach: בוחן לימודי', 'הורדת הערות', 'העלאת הערות', 'מידע על הערה'],
        pt: ['Adicionar célula', 'Aumentar zoom', 'Diminuir zoom', 'Alternar grade guia', 'Alternar ditado', 'Analisar notas via API', 'Modo Coach: quiz de estudo', 'Baixar notas', 'Enviar notas', 'Informações da nota'],
        el: ['Προσθήκη κελιού', 'Μεγέθυνση', 'Σμίκρυνση', 'Εναλλαγή πλέγματος οδηγού', 'Εναλλαγή υπαγόρευσης', 'Ανάλυση σημειώσεων μέσω API', 'Λειτουργία Coach: κουίζ μελέτης', 'Λήψη σημειώσεων', 'Μεταφόρτωση σημειώσεων', 'Πληροφορίες σημείωσης'],
        vi: ['Thêm ô', 'Phóng to', 'Thu nhỏ', 'Bật/tắt lưới hướng dẫn', 'Bật/tắt đọc chính tả', 'Phân tích ghi chú qua API', 'Chế độ Coach: câu hỏi ôn tập', 'Tải ghi chú xuống', 'Tải ghi chú lên', 'Thông tin ghi chú'],
        ko: ['셀 추가', '확대', '축소', '가이드 격자 전환', '받아쓰기 전환', 'API로 노트 분석', 'Coach 모드 학습 퀴즈', '노트 다운로드', '노트 업로드', '노트 정보'],
        id: ['Tambah sel', 'Perbesar', 'Perkecil', 'Alihkan grid panduan', 'Alihkan dikte', 'Analisis catatan via API', 'Mode Coach kuis belajar', 'Unduh catatan', 'Unggah catatan', 'Info catatan'],
        fa: ['افزودن سلول', 'بزرگ‌نمایی', 'کوچک‌نمایی', 'تغییر شبکه راهنما', 'تغییر گفتار به متن', 'تحلیل یادداشت‌ها با API', 'حالت Coach: آزمون مطالعه', 'دانلود یادداشت‌ها', 'آپلود یادداشت‌ها', 'اطلاعات یادداشت'],
        yi: ['צולייגן צעל', 'פֿאַרגרעסערן', 'פֿאַרקלעענערן', 'בייטן הילף־גריד', 'בייטן דיקטאַציע', 'אַנאַליזירן נאָטיצן דורך API', 'Coach מאָדוס לערן־קוויז', 'אַראָפּלאָדן נאָטיצן', 'אַרויפֿלאָדן נאָטיצן', 'נאָטיץ אינפֿאָרמאַציע']
    };

    function normalizeLanguage(language) {
        const value = String(language || '').trim().toLowerCase();
        if (!value) return 'en';
        if (TRANSLATIONS[value]) return value;
        if (ALIASES[value]) return ALIASES[value];
        const primary = value.split('-')[0];
        return TRANSLATIONS[primary] ? primary : value;
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element && value) element.textContent = value;
    }

    function setAllText(selector, value) {
        if (!value) return;
        document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
    }

    function setPlaceholder(selector, value) {
        const element = document.querySelector(selector);
        if (element && value) element.setAttribute('data-placeholder', value);
    }

    function applyExtraLanguage(language, announce = false) {
        const normalized = normalizeLanguage(language);
        const labels = TRANSLATIONS[normalized];
        if (!labels) return false;

        document.documentElement.lang = normalized;
        document.documentElement.dir = RTL_LANGUAGES.has(normalized) ? 'rtl' : 'ltr';
        document.documentElement.dataset.uiLanguage = normalized;
        try { localStorage.setItem(STORAGE_KEY, normalized); } catch (_) {}

        const select = document.getElementById('ui-language');
        if (select && select.value !== normalized) select.value = normalized;

        setText('#title-bar h1', labels.appTitle);
        setText('.menu-header', labels.menuTitle);
        setText('#apiNewBtn span:last-child', labels.new);
        setText('#apiOpenBtn span:last-child', labels.cloudOpen);
        setText('#apiSaveBtn span:last-child', labels.cloudSave);
        setText('#localOpenBtn span:last-child', labels.localOpen);
        setText('#localSaveBtn span:last-child', labels.localSave);
        setText('#toggleDarkMode span:last-child', labels.toggleTheme);
        setText('#aiSettingsDetails .menu-details-summary', labels.aiSettings);
        setText('label[for="llm-provider"]', labels.aiProvider);
        setText('label[for="llm-model"]', labels.aiModel);
        setText('label[for="gemini-api-key"]', labels.geminiKey);
        setText('label[for="openai-api-key"]', labels.openaiKey);
        setText('label[for="ollama-base-url"]', labels.ollamaUrl);
        setText('label[for="api-base-url"]', labels.backendUrl);
        setText('#aiSettingsDetails .menu-hint', labels.aiHint);
        setText('label[for="pro-mode"] span', labels.proMode);
        setText('#pro-mode', labels.proMode);
        setText('#dictationSettingsDetails .menu-details-summary', labels.dictationSettings);
        setText('label[for="dictation-language"]', labels.speechLanguage);
        setText('label[for="dictation-continuous"] span', labels.continuousListening);
        setText('label[for="dictation-interim"] span', labels.interimRecognition);
        setText('#dictationTestBtn span:last-child', labels.testDictation);
        setText('#dictationSettingsDetails .menu-hint', labels.dictationHint);
        setText('label[for="ui-language"]', labels.uiLanguage);
        setText('section.menu-section--field .menu-hint', labels.uiLanguageHint);
        setText('#about span:last-child', labels.about);
        setText('#help span:last-child', labels.help);
        setText('#feedback span:last-child', labels.feedback);
        setText('.heading-color-button:first-child span', labels.headingColor);
        setText('.heading-color-button:nth-child(2) span', labels.textColor);
        setText('.cornell-column--cue .column-title', labels.cueColumn);
        setText('.column-title--summary', labels.summary);
        setText('.analysis-panel__title', labels.llmInsights);
        setText('#analysisOverview .analysis-panel__section-title', labels.overview);
        setText('#analysisSwot .analysis-panel__section-title', labels.analysis);
        setText('#analysisConcepts .analysis-panel__section-title', labels.concepts);
        setText('#analysisSuggested .analysis-panel__section-title', labels.suggestedLinks);
        setText('#analysisSeeAlso .analysis-panel__section-title', labels.seeAlso);
        setText('#analysisVideos .analysis-panel__section-title', labels.videos);
        setText('.toolbar-color-button:first-child span', labels.cell);
        setText('.toolbar-color-button:nth-child(2) span', labels.textColor);
        setText('#addBox', labels.addBox);
        setText('#deleteBox', labels.deleteBox);
        setText('#duplicateBox', labels.duplicateBox);
        setText('#link .dropdown-button', labels.linkSystem);
        setText('#apiOpenDialog .api-open-dialog__header', labels.openServer);
        setText('#apiOpenRefresh', labels.refresh);
        setText('#apiOpenCancel', labels.close);
        setText('#helpDialog .api-open-dialog__header', labels.helpTitle);
        setText('#helpDialog h3', labels.howToUse);
        setText('#aboutDialog .api-open-dialog__header', labels.aboutTitle);
        setText('#feedbackDialog .api-open-dialog__header', labels.feedbackTitle);
        setText('label[for="feedbackMessage"]', labels.feedbackMessage);
        setText('#feedbackDialog .menu-hint', labels.feedbackHint);
        setText('#feedbackEmailBtn', labels.openEmail);
        setText('#feedbackForumBtn', labels.forumsDiscord);
        setAllText('.api-open-dialog__actions button[onclick*="close"]', labels.close);

        setPlaceholder('#headingText', labels.headingPlaceholder);
        setPlaceholder('#cueText', labels.cuePlaceholder);
        setPlaceholder('#notesText', labels.summaryPlaceholder);
        const feedbackMessage = document.getElementById('feedbackMessage');
        if (feedbackMessage) feedbackMessage.placeholder = labels.feedbackPlaceholder;

        const helpItems = document.querySelectorAll('#helpDialog li');
        if (helpItems[0]) helpItems[0].innerHTML = `<strong>${labels.helpAddBoxes}</strong> ${labels.helpAddBoxesText}`;
        if (helpItems[1]) helpItems[1].innerHTML = `<strong>${labels.helpLinkBoxes}</strong> ${labels.helpLinkBoxesText}`;
        if (helpItems[2]) helpItems[2].innerHTML = `<strong>${labels.helpAnalyzeAi}</strong> ${labels.helpAnalyzeAiText}`;

        const toolbarButtons = document.querySelectorAll('#toolbarBar .button');
        (TOOL_TITLES[normalized] || []).forEach((title, index) => {
            if (toolbarButtons[index]) toolbarButtons[index].title = title;
        });

        if (announce && typeof window.showStatusMessage === 'function') {
            window.showStatusMessage(labels.languageApplied, 'success');
        }
        return true;
    }

    function handleLanguageEvent(event) {
        const language = normalizeLanguage(event.target.value);
        if (!EXTRA_LANGUAGES.has(language)) return;
        event.stopImmediatePropagation();
        applyExtraLanguage(language, true);
    }

    function initExtraLanguages() {
        const select = document.getElementById('ui-language');
        if (!select) return;
        select.addEventListener('input', handleLanguageEvent, true);
        select.addEventListener('change', handleLanguageEvent, true);

        const stored = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
        if (EXTRA_LANGUAGES.has(stored)) applyExtraLanguage(stored, false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExtraLanguages);
    } else {
        initExtraLanguages();
    }
})();
