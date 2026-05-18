// --------------------------------------------------------------------------
// DOM Element and Data Initialization
// --------------------------------------------------------------------------

// Map to store box elements, with their ID as keys and an object
// containing the box element and a Map of connected lines as values.
let boxes = new Map();

// Array, currently not used for any specific functionality.
let bin = [];

// Counter for the total number of boxes created. Used to assign unique IDs.
let totalBoxes = 1;

// Track auxiliary UI state such as the canvas grid visibility.
let isGridActive = false;
let isDictating = false;
let dictationRecognition = null;
let dictationTarget = null;
const AI_PREFS_STORAGE_KEY = 'treenotes-ai-preferences';
const DICTATION_PREFS_STORAGE_KEY = 'treenotes-dictation-preferences';
const UI_LANGUAGE_STORAGE_KEY = 'treenotes-ui-language';
const UI_LANGUAGE_BUILD_ID = '20260518-ui-polish-1';
let connectionStatusState = 'checking';
let connectionStatusTimer = null;
const SUPPORTED_UI_LANGUAGES = [
    { code: 'en', nativeName: 'English' },
    { code: 'fr', nativeName: 'Français' },
    { code: 'de', nativeName: 'Deutsch' },
    { code: 'es', nativeName: 'Español' },
    { code: 'it', nativeName: 'Italiano' },
    { code: 'pt', nativeName: 'Português' },
    { code: 'ru', nativeName: 'Русский' },
    { code: 'el', nativeName: 'Ελληνικά' },
    { code: 'vi', nativeName: 'Tiếng Việt' },
    { code: 'zh', nativeName: '中文（普通话）' },
    { code: 'ja', nativeName: '日本語' },
    { code: 'ko', nativeName: '한국어' },
    { code: 'id', nativeName: 'Bahasa Indonesia' },
    { code: 'ar', nativeName: 'العربية' },
    { code: 'fa', nativeName: 'فارسی' },
    { code: 'he', nativeName: 'עברית' },
    { code: 'yi', nativeName: 'ייִדיש' }
];
const SUPPORTED_UI_LANGUAGE_CODES = new Set(SUPPORTED_UI_LANGUAGES.map(language => language.code));
const SUPPORTED_SPEECH_LANGUAGES = [
    { value: '', labelKey: 'browserDefault', lang: 'en', uiCode: 'en' },
    { value: 'en-AU', label: 'English (Australia)', lang: 'en-AU', uiCode: 'en' },
    { value: 'en-US', label: 'English (US)', lang: 'en-US', uiCode: 'en' },
    { value: 'en-GB', label: 'English (UK)', lang: 'en-GB', uiCode: 'en' },
    { value: 'fr-FR', label: 'Français', lang: 'fr-FR', uiCode: 'fr' },
    { value: 'de-DE', label: 'Deutsch', lang: 'de-DE', uiCode: 'de' },
    { value: 'es-ES', label: 'Español', lang: 'es-ES', uiCode: 'es' },
    { value: 'it-IT', label: 'Italiano', lang: 'it-IT', uiCode: 'it' },
    { value: 'pt-PT', label: 'Português', lang: 'pt-PT', uiCode: 'pt' },
    { value: 'ru-RU', label: 'Русский', lang: 'ru-RU', uiCode: 'ru' },
    { value: 'el-GR', label: 'Ελληνικά', lang: 'el-GR', uiCode: 'el' },
    { value: 'vi-VN', label: 'Tiếng Việt', lang: 'vi-VN', uiCode: 'vi' },
    { value: 'zh-CN', label: '中文（普通话）', lang: 'zh-CN', uiCode: 'zh' },
    { value: 'ja-JP', label: '日本語', lang: 'ja-JP', uiCode: 'ja' },
    { value: 'ko-KR', label: '한국어', lang: 'ko-KR', uiCode: 'ko' },
    { value: 'id-ID', label: 'Bahasa Indonesia', lang: 'id-ID', uiCode: 'id' },
    { value: 'ar-SA', label: 'العربية', lang: 'ar-SA', uiCode: 'ar' },
    { value: 'fa-IR', label: 'فارسی', lang: 'fa-IR', uiCode: 'fa' },
    { value: 'he-IL', label: 'עברית', lang: 'he-IL', uiCode: 'he' },
    { value: 'yi', label: 'ייִדיש', lang: 'yi', uiCode: 'yi' }
];
const UI_TRANSLATIONS = {
    en: {
        appTitle: 'Tree Notes',
        menuTitle: '📘 TreeNotes',
        new: 'New',
        cloudOpen: 'Cloud Load/Open',
        cloudSave: 'Cloud Save',
        localOpen: 'Local Load/Open',
        localSave: 'Local Save',
        toggleTheme: 'Toggle Light/Dark Mode',
        aiSettings: 'AI Settings',
        aiProvider: 'AI provider',
        aiModel: 'AI model',
        geminiKey: 'Gemini API key',
        openaiKey: 'OpenAI API key',
        ollamaUrl: 'Ollama URL',
        backendUrl: 'Backend API URL',
        aiHint: 'Keys are sent only to the backend analysis endpoint, not saved inside note files.',
        proMode: 'Quick Pro Mode Toggle',
        proHint: 'Tells AI to prioritize high-authority academic, scientific, government, medical, legal, and publisher sources.',
        dictationSettings: 'Dictation Settings',
        speechLanguage: 'Speech language',
        continuousListening: 'Continuous listening',
        interimRecognition: 'Use interim recognition',
        testDictation: 'Test Dictation',
        dictationHint: 'Uses browser speech recognition and the current system microphone.',
        uiLanguage: 'UI Language',
        uiLanguageHint: 'Changes interface labels only; AI can already handle multilingual notes.',
        about: 'About',
        help: 'Help',
        feedback: 'Send Feedback',
        headingPlaceholder: 'Cornell Note Heading',
        headingColor: 'Heading',
        textColor: 'Text',
        cueColumn: 'Cue Column',
        cuePlaceholder: 'Cue column data, key words, key questions',
        summary: 'Summary',
        summaryPlaceholder: 'Type your summary here...',
        llmInsights: 'LLM Insights',
        overview: 'Overview',
        analysis: 'Analysis',
        concepts: 'Concepts',
        suggestedLinks: 'Suggested links',
        seeAlso: 'See Also',
        videos: 'Videos',
        cell: 'Cell',
        addBox: '+ Add Box',
        deleteBox: '− Delete Box',
        duplicateBox: '* Duplicate Box',
        linkSystem: 'Link System',
        openServer: 'Open from server',
        refresh: 'Refresh',
        close: 'Close',
        helpTitle: 'Help & Instructions',
        howToUse: 'How to use TreeNotes:',
        helpAddBoxes: 'Add Boxes:',
        helpAddBoxesText: 'Click the ➕ button in the toolbar to add a new note.',
        helpLinkBoxes: 'Link Boxes:',
        helpLinkBoxesText: 'Select a box, hover over "Link System" in the popup menu, and pick another box.',
        helpAnalyzeAi: 'Analyze AI:',
        helpAnalyzeAiText: 'Click the 🤖 button to get AI insights about your notes.',
        aboutTitle: 'About TreeNotes',
        feedbackTitle: 'Send Feedback',
        feedbackMessage: 'Message for the development team',
        feedbackPlaceholder: 'Describe the issue, idea, or workflow you want improved.',
        feedbackHint: 'This beta build opens your email app with the message. Forums/Discord links can be added when available.',
        openEmail: 'Open Email',
        forumsDiscord: 'Forums/Discord',
        addBoxTitle: 'Add box',
        zoomInTitle: 'Zoom in',
        zoomOutTitle: 'Zoom out',
        gridTitle: 'Toggle guide grid',
        dictationTitle: 'Toggle dictation',
        analyzeTitle: 'Analyze notes via API',
        coachTitle: 'Coach Mode study quiz',
        downloadTitle: 'Download notes',
        uploadTitle: 'Upload notes',
        noteInfoTitle: 'Note info',
        languageApplied: 'Interface language updated.'
    },
    fr: {
        appTitle: 'Notes Arborescentes',
        menuTitle: '📘 TreeNotes',
        new: 'Nouveau',
        cloudOpen: 'Ouvrir depuis le cloud',
        cloudSave: 'Enregistrer dans le cloud',
        localOpen: 'Ouvrir localement',
        localSave: 'Enregistrer localement',
        toggleTheme: 'Mode clair/sombre',
        aiSettings: 'Paramètres IA',
        aiProvider: 'Fournisseur IA',
        aiModel: 'Modèle IA',
        geminiKey: 'Clé API Gemini',
        openaiKey: 'Clé API OpenAI',
        ollamaUrl: 'URL Ollama',
        backendUrl: 'URL API backend',
        aiHint: "Les clés sont envoyées seulement au point d'analyse backend, pas enregistrées dans les notes.",
        proMode: 'Mode Pro rapide',
        proHint: "Demande à l'IA de privilégier les sources académiques, scientifiques, gouvernementales, médicales, juridiques et éditoriales fiables.",
        dictationSettings: 'Paramètres de dictée',
        speechLanguage: 'Langue vocale',
        continuousListening: 'Écoute continue',
        interimRecognition: 'Utiliser la reconnaissance intermédiaire',
        testDictation: 'Tester la dictée',
        dictationHint: 'Utilise la reconnaissance vocale du navigateur et le microphone du système.',
        uiLanguage: "Langue de l'interface",
        uiLanguageHint: "Modifie seulement les libellés de l'interface ; l'IA gère déjà les notes multilingues.",
        about: 'À propos',
        help: 'Aide',
        feedback: 'Envoyer un retour',
        headingPlaceholder: 'Titre de la note Cornell',
        headingColor: 'En-tête',
        textColor: 'Texte',
        cueColumn: 'Colonne indices',
        cuePlaceholder: 'Indices, mots-clés, questions clés',
        summary: 'Résumé',
        summaryPlaceholder: 'Tapez votre résumé ici...',
        llmInsights: 'Aperçus LLM',
        overview: 'Vue d’ensemble',
        analysis: 'Analyse',
        concepts: 'Concepts',
        suggestedLinks: 'Liens suggérés',
        seeAlso: 'Voir aussi',
        videos: 'Vidéos',
        cell: 'Cellule',
        addBox: '+ Ajouter cellule',
        deleteBox: '− Supprimer cellule',
        duplicateBox: '* Dupliquer cellule',
        linkSystem: 'Système de liens',
        openServer: 'Ouvrir depuis le serveur',
        refresh: 'Actualiser',
        close: 'Fermer',
        helpTitle: 'Aide et instructions',
        howToUse: 'Comment utiliser TreeNotes :',
        helpAddBoxes: 'Ajouter des cellules :',
        helpAddBoxesText: 'Cliquez sur ➕ dans la barre d’outils pour ajouter une note.',
        helpLinkBoxes: 'Relier des cellules :',
        helpLinkBoxesText: 'Sélectionnez une cellule, survolez le système de liens, puis choisissez une autre cellule.',
        helpAnalyzeAi: 'Analyse IA :',
        helpAnalyzeAiText: 'Cliquez sur 🤖 pour obtenir des aperçus IA de vos notes.',
        aboutTitle: 'À propos de TreeNotes',
        feedbackTitle: 'Envoyer un retour',
        feedbackMessage: "Message pour l'équipe de développement",
        feedbackPlaceholder: "Décrivez le problème, l'idée ou le flux à améliorer.",
        feedbackHint: 'Cette bêta ouvre votre application e-mail avec le message.',
        openEmail: 'Ouvrir e-mail',
        forumsDiscord: 'Forums/Discord',
        languageApplied: "Langue de l'interface mise à jour."
    },
    de: {
        appTitle: 'Baum-Notizen',
        menuTitle: '📘 TreeNotes',
        new: 'Neu',
        cloudOpen: 'Aus Cloud öffnen',
        cloudSave: 'In Cloud speichern',
        localOpen: 'Lokal öffnen',
        localSave: 'Lokal speichern',
        toggleTheme: 'Hell/Dunkel umschalten',
        aiSettings: 'KI-Einstellungen',
        aiProvider: 'KI-Anbieter',
        aiModel: 'KI-Modell',
        geminiKey: 'Gemini API-Schlüssel',
        openaiKey: 'OpenAI API-Schlüssel',
        ollamaUrl: 'Ollama-URL',
        backendUrl: 'Backend-API-URL',
        aiHint: 'Schlüssel werden nur an den Backend-Analyse-Endpunkt gesendet und nicht in Notizen gespeichert.',
        proMode: 'Schneller Pro-Modus',
        proHint: 'Die KI priorisiert hochwertige akademische, wissenschaftliche, behördliche, medizinische, juristische und Verlagsquellen.',
        dictationSettings: 'Diktat-Einstellungen',
        speechLanguage: 'Spracheingabe',
        continuousListening: 'Kontinuierlich zuhören',
        interimRecognition: 'Zwischenergebnisse verwenden',
        testDictation: 'Diktat testen',
        dictationHint: 'Nutzt Spracherkennung des Browsers und das Systemmikrofon.',
        uiLanguage: 'UI-Sprache',
        uiLanguageHint: 'Ändert nur Interface-Beschriftungen; die KI kann bereits mehrsprachige Notizen verarbeiten.',
        about: 'Über',
        help: 'Hilfe',
        feedback: 'Feedback senden',
        headingPlaceholder: 'Cornell-Notiztitel',
        headingColor: 'Kopf',
        textColor: 'Text',
        cueColumn: 'Hinweisspalte',
        cuePlaceholder: 'Hinweise, Schlüsselwörter, Leitfragen',
        summary: 'Zusammenfassung',
        summaryPlaceholder: 'Zusammenfassung hier eingeben...',
        llmInsights: 'LLM-Einblicke',
        overview: 'Überblick',
        analysis: 'Analyse',
        concepts: 'Konzepte',
        suggestedLinks: 'Vorgeschlagene Links',
        seeAlso: 'Siehe auch',
        videos: 'Videos',
        cell: 'Zelle',
        addBox: '+ Zelle hinzufügen',
        deleteBox: '− Zelle löschen',
        duplicateBox: '* Zelle duplizieren',
        linkSystem: 'Link-System',
        openServer: 'Vom Server öffnen',
        refresh: 'Aktualisieren',
        close: 'Schließen',
        helpTitle: 'Hilfe & Anleitung',
        howToUse: 'So verwendest du TreeNotes:',
        helpAddBoxes: 'Zellen hinzufügen:',
        helpAddBoxesText: 'Klicke auf ➕ in der Werkzeugleiste, um eine Notiz hinzuzufügen.',
        helpLinkBoxes: 'Zellen verlinken:',
        helpLinkBoxesText: 'Wähle eine Zelle, öffne das Link-System und wähle eine andere Zelle.',
        helpAnalyzeAi: 'KI-Analyse:',
        helpAnalyzeAiText: 'Klicke auf 🤖, um KI-Einblicke zu erhalten.',
        aboutTitle: 'Über TreeNotes',
        feedbackTitle: 'Feedback senden',
        feedbackMessage: 'Nachricht an das Entwicklungsteam',
        feedbackPlaceholder: 'Beschreibe Problem, Idee oder Workflow.',
        feedbackHint: 'Diese Beta öffnet deine E-Mail-App mit der Nachricht.',
        openEmail: 'E-Mail öffnen',
        forumsDiscord: 'Foren/Discord',
        languageApplied: 'Interface-Sprache aktualisiert.'
    },
    es: {
        appTitle: 'Notas en Árbol',
        menuTitle: '📘 TreeNotes',
        new: 'Nuevo',
        cloudOpen: 'Abrir desde la nube',
        cloudSave: 'Guardar en la nube',
        localOpen: 'Abrir local',
        localSave: 'Guardar local',
        toggleTheme: 'Cambiar modo claro/oscuro',
        aiSettings: 'Ajustes de IA',
        aiProvider: 'Proveedor de IA',
        aiModel: 'Modelo de IA',
        geminiKey: 'Clave API de Gemini',
        openaiKey: 'Clave API de OpenAI',
        ollamaUrl: 'URL de Ollama',
        backendUrl: 'URL API backend',
        aiHint: 'Las claves solo se envían al endpoint de análisis backend y no se guardan en las notas.',
        proMode: 'Modo Pro rápido',
        proHint: 'Indica a la IA que priorice fuentes académicas, científicas, gubernamentales, médicas, legales y editoriales de alta autoridad.',
        dictationSettings: 'Ajustes de dictado',
        speechLanguage: 'Idioma de voz',
        continuousListening: 'Escucha continua',
        interimRecognition: 'Usar reconocimiento intermedio',
        testDictation: 'Probar dictado',
        dictationHint: 'Usa el reconocimiento de voz del navegador y el micrófono del sistema.',
        uiLanguage: 'Idioma de interfaz',
        uiLanguageHint: 'Cambia solo las etiquetas de la interfaz; la IA ya maneja notas multilingües.',
        about: 'Acerca de',
        help: 'Ayuda',
        feedback: 'Enviar comentarios',
        headingPlaceholder: 'Título de nota Cornell',
        headingColor: 'Encabezado',
        textColor: 'Texto',
        cueColumn: 'Columna de pistas',
        cuePlaceholder: 'Pistas, palabras clave, preguntas clave',
        summary: 'Resumen',
        summaryPlaceholder: 'Escribe tu resumen aquí...',
        llmInsights: 'Ideas del LLM',
        overview: 'Resumen general',
        analysis: 'Análisis',
        concepts: 'Conceptos',
        suggestedLinks: 'Enlaces sugeridos',
        seeAlso: 'Ver también',
        videos: 'Vídeos',
        cell: 'Celda',
        addBox: '+ Añadir celda',
        deleteBox: '− Eliminar celda',
        duplicateBox: '* Duplicar celda',
        linkSystem: 'Sistema de enlaces',
        openServer: 'Abrir desde servidor',
        refresh: 'Actualizar',
        close: 'Cerrar',
        helpTitle: 'Ayuda e instrucciones',
        howToUse: 'Cómo usar TreeNotes:',
        helpAddBoxes: 'Añadir celdas:',
        helpAddBoxesText: 'Haz clic en ➕ en la barra de herramientas para añadir una nota.',
        helpLinkBoxes: 'Enlazar celdas:',
        helpLinkBoxesText: 'Selecciona una celda, abre el sistema de enlaces y elige otra celda.',
        helpAnalyzeAi: 'Analizar IA:',
        helpAnalyzeAiText: 'Haz clic en 🤖 para obtener ideas de IA sobre tus notas.',
        aboutTitle: 'Acerca de TreeNotes',
        feedbackTitle: 'Enviar comentarios',
        feedbackMessage: 'Mensaje para el equipo de desarrollo',
        feedbackPlaceholder: 'Describe el problema, idea o flujo que quieres mejorar.',
        feedbackHint: 'Esta beta abre tu app de correo con el mensaje.',
        openEmail: 'Abrir correo',
        forumsDiscord: 'Foros/Discord',
        languageApplied: 'Idioma de interfaz actualizado.'
    },
    it: {
        appTitle: 'Note ad Albero',
        menuTitle: '📘 TreeNotes',
        new: 'Nuovo',
        cloudOpen: 'Apri dal cloud',
        cloudSave: 'Salva nel cloud',
        localOpen: 'Apri locale',
        localSave: 'Salva locale',
        toggleTheme: 'Attiva chiaro/scuro',
        aiSettings: 'Impostazioni IA',
        aiProvider: 'Fornitore IA',
        aiModel: 'Modello IA',
        geminiKey: 'Chiave API Gemini',
        openaiKey: 'Chiave API OpenAI',
        ollamaUrl: 'URL Ollama',
        backendUrl: 'URL API backend',
        aiHint: 'Le chiavi sono inviate solo all’endpoint di analisi backend e non salvate nelle note.',
        proMode: 'Modalità Pro rapida',
        proHint: 'Chiede all’IA di dare priorità a fonti accademiche, scientifiche, governative, mediche, legali ed editoriali autorevoli.',
        dictationSettings: 'Impostazioni dettatura',
        speechLanguage: 'Lingua parlata',
        continuousListening: 'Ascolto continuo',
        interimRecognition: 'Usa riconoscimento intermedio',
        testDictation: 'Prova dettatura',
        dictationHint: 'Usa il riconoscimento vocale del browser e il microfono di sistema.',
        uiLanguage: 'Lingua interfaccia',
        uiLanguageHint: 'Cambia solo le etichette dell’interfaccia; l’IA gestisce già note multilingue.',
        about: 'Informazioni',
        help: 'Aiuto',
        feedback: 'Invia feedback',
        headingPlaceholder: 'Titolo nota Cornell',
        headingColor: 'Intestazione',
        textColor: 'Testo',
        cueColumn: 'Colonna indizi',
        cuePlaceholder: 'Indizi, parole chiave, domande chiave',
        summary: 'Riepilogo',
        summaryPlaceholder: 'Scrivi qui il riepilogo...',
        llmInsights: 'Approfondimenti LLM',
        overview: 'Panoramica',
        analysis: 'Analisi',
        concepts: 'Concetti',
        suggestedLinks: 'Link suggeriti',
        seeAlso: 'Vedi anche',
        videos: 'Video',
        cell: 'Cella',
        addBox: '+ Aggiungi cella',
        deleteBox: '− Elimina cella',
        duplicateBox: '* Duplica cella',
        linkSystem: 'Sistema link',
        openServer: 'Apri dal server',
        refresh: 'Aggiorna',
        close: 'Chiudi',
        helpTitle: 'Aiuto e istruzioni',
        howToUse: 'Come usare TreeNotes:',
        helpAddBoxes: 'Aggiungi celle:',
        helpAddBoxesText: 'Fai clic su ➕ nella barra strumenti per aggiungere una nota.',
        helpLinkBoxes: 'Collega celle:',
        helpLinkBoxesText: 'Seleziona una cella, apri il sistema link e scegli un’altra cella.',
        helpAnalyzeAi: 'Analisi IA:',
        helpAnalyzeAiText: 'Fai clic su 🤖 per ottenere approfondimenti IA sulle note.',
        aboutTitle: 'Informazioni su TreeNotes',
        feedbackTitle: 'Invia feedback',
        feedbackMessage: 'Messaggio per il team di sviluppo',
        feedbackPlaceholder: 'Descrivi problema, idea o flusso da migliorare.',
        feedbackHint: 'Questa beta apre la tua app email con il messaggio.',
        openEmail: 'Apri email',
        forumsDiscord: 'Forum/Discord',
        languageApplied: 'Lingua interfaccia aggiornata.'
    },
    zh: {
        appTitle: '树状笔记',
        menuTitle: '📘 TreeNotes',
        new: '新建',
        cloudOpen: '从云端打开',
        cloudSave: '保存到云端',
        localOpen: '本地打开',
        localSave: '本地保存',
        toggleTheme: '切换浅色/深色模式',
        aiSettings: 'AI 设置',
        aiProvider: 'AI 提供方',
        aiModel: 'AI 模型',
        geminiKey: 'Gemini API 密钥',
        openaiKey: 'OpenAI API 密钥',
        ollamaUrl: 'Ollama 地址',
        backendUrl: '后端 API 地址',
        aiHint: '密钥只会发送到后端分析接口，不会保存到笔记文件中。',
        proMode: '快速专业模式',
        proHint: '让 AI 优先使用高权威的学术、科学、政府、医学、法律和出版社来源。',
        dictationSettings: '听写设置',
        speechLanguage: '语音语言',
        continuousListening: '连续监听',
        interimRecognition: '使用临时识别结果',
        testDictation: '测试听写',
        dictationHint: '使用浏览器语音识别和当前系统麦克风。',
        uiLanguage: '界面语言',
        uiLanguageHint: '只更改界面标签；AI 已能处理多语言笔记。',
        about: '关于',
        help: '帮助',
        feedback: '发送反馈',
        headingPlaceholder: '康奈尔笔记标题',
        headingColor: '标题栏',
        textColor: '文本',
        cueColumn: '提示栏',
        cuePlaceholder: '提示、关键词、关键问题',
        summary: '总结',
        summaryPlaceholder: '在这里输入总结...',
        llmInsights: 'LLM 洞察',
        overview: '概览',
        analysis: '分析',
        concepts: '概念',
        suggestedLinks: '建议链接',
        seeAlso: '另请参阅',
        videos: '视频',
        cell: '单元格',
        addBox: '+ 添加单元格',
        deleteBox: '− 删除单元格',
        duplicateBox: '* 复制单元格',
        linkSystem: '链接系统',
        openServer: '从服务器打开',
        refresh: '刷新',
        close: '关闭',
        helpTitle: '帮助与说明',
        howToUse: '如何使用 TreeNotes：',
        helpAddBoxes: '添加单元格：',
        helpAddBoxesText: '点击工具栏中的 ➕ 添加新笔记。',
        helpLinkBoxes: '链接单元格：',
        helpLinkBoxesText: '选择一个单元格，打开链接系统，然后选择另一个单元格。',
        helpAnalyzeAi: 'AI 分析：',
        helpAnalyzeAiText: '点击 🤖 获取关于笔记的 AI 洞察。',
        aboutTitle: '关于 TreeNotes',
        feedbackTitle: '发送反馈',
        feedbackMessage: '给开发团队的消息',
        feedbackPlaceholder: '描述你想改进的问题、想法或工作流程。',
        feedbackHint: '此测试版会用你的邮件应用打开该消息。',
        openEmail: '打开邮件',
        forumsDiscord: '论坛/Discord',
        languageApplied: '界面语言已更新。'
    },
    hi: {
        appTitle: 'ट्री नोट्स',
        menuTitle: '📘 TreeNotes',
        new: 'नया',
        cloudOpen: 'क्लाउड से खोलें',
        cloudSave: 'क्लाउड में सहेजें',
        localOpen: 'स्थानीय फ़ाइल खोलें',
        localSave: 'स्थानीय रूप से सहेजें',
        toggleTheme: 'लाइट/डार्क मोड बदलें',
        aiSettings: 'AI सेटिंग्स',
        aiProvider: 'AI प्रदाता',
        aiModel: 'AI मॉडल',
        geminiKey: 'Gemini API कुंजी',
        openaiKey: 'OpenAI API कुंजी',
        ollamaUrl: 'Ollama URL',
        backendUrl: 'बैकएंड API URL',
        aiHint: 'कुंजियाँ केवल बैकएंड विश्लेषण endpoint को भेजी जाती हैं, नोट फ़ाइलों में नहीं सहेजी जातीं।',
        proMode: 'त्वरित प्रो मोड',
        proHint: 'AI को उच्च-प्रामाणिक शैक्षणिक, वैज्ञानिक, सरकारी, चिकित्सा, कानूनी और प्रकाशक स्रोतों को प्राथमिकता देने को कहता है।',
        dictationSettings: 'डिक्टेशन सेटिंग्स',
        speechLanguage: 'बोली की भाषा',
        continuousListening: 'लगातार सुनना',
        interimRecognition: 'अंतरिम पहचान का उपयोग करें',
        testDictation: 'डिक्टेशन टेस्ट करें',
        dictationHint: 'ब्राउज़र speech recognition और सिस्टम माइक्रोफोन का उपयोग करता है।',
        uiLanguage: 'UI भाषा',
        uiLanguageHint: 'केवल इंटरफ़ेस लेबल बदलता है; AI पहले से बहुभाषी नोट्स संभाल सकता है।',
        about: 'परिचय',
        help: 'सहायता',
        feedback: 'फ़ीडबैक भेजें',
        headingPlaceholder: 'Cornell नोट शीर्षक',
        headingColor: 'शीर्षक',
        textColor: 'टेक्स्ट',
        cueColumn: 'क्यू कॉलम',
        cuePlaceholder: 'क्यू, मुख्य शब्द, मुख्य प्रश्न',
        summary: 'सारांश',
        summaryPlaceholder: 'अपना सारांश यहाँ लिखें...',
        llmInsights: 'LLM इनसाइट्स',
        overview: 'अवलोकन',
        analysis: 'विश्लेषण',
        concepts: 'अवधारणाएँ',
        suggestedLinks: 'सुझाए गए लिंक',
        seeAlso: 'यह भी देखें',
        videos: 'वीडियो',
        cell: 'सेल',
        addBox: '+ सेल जोड़ें',
        deleteBox: '− सेल हटाएँ',
        duplicateBox: '* सेल डुप्लिकेट करें',
        linkSystem: 'लिंक सिस्टम',
        openServer: 'सर्वर से खोलें',
        refresh: 'रीफ़्रेश',
        close: 'बंद करें',
        helpTitle: 'सहायता और निर्देश',
        howToUse: 'TreeNotes का उपयोग कैसे करें:',
        helpAddBoxes: 'सेल जोड़ें:',
        helpAddBoxesText: 'नई नोट जोड़ने के लिए टूलबार में ➕ क्लिक करें।',
        helpLinkBoxes: 'सेल लिंक करें:',
        helpLinkBoxesText: 'एक सेल चुनें, लिंक सिस्टम खोलें, फिर दूसरी सेल चुनें।',
        helpAnalyzeAi: 'AI विश्लेषण:',
        helpAnalyzeAiText: 'अपने नोट्स पर AI इनसाइट्स पाने के लिए 🤖 क्लिक करें।',
        aboutTitle: 'TreeNotes के बारे में',
        feedbackTitle: 'फ़ीडबैक भेजें',
        feedbackMessage: 'डेवलपमेंट टीम के लिए संदेश',
        feedbackPlaceholder: 'समस्या, विचार या workflow सुधार का वर्णन करें।',
        feedbackHint: 'यह beta आपके ईमेल ऐप में संदेश खोलता है।',
        openEmail: 'ईमेल खोलें',
        forumsDiscord: 'फ़ोरम/Discord',
        languageApplied: 'इंटरफ़ेस भाषा अपडेट हो गई।'
    },
    ru: {
        appTitle: 'Древовидные заметки',
        menuTitle: '📘 TreeNotes',
        new: 'Создать',
        cloudOpen: 'Открыть из облака',
        cloudSave: 'Сохранить в облако',
        localOpen: 'Открыть локально',
        localSave: 'Сохранить локально',
        toggleTheme: 'Светлая/тёмная тема',
        aiSettings: 'Настройки ИИ',
        aiProvider: 'Поставщик ИИ',
        aiModel: 'Модель ИИ',
        geminiKey: 'API-ключ Gemini',
        openaiKey: 'API-ключ OpenAI',
        ollamaUrl: 'URL Ollama',
        backendUrl: 'URL backend API',
        aiHint: 'Ключи отправляются только в backend endpoint анализа и не сохраняются в файлах заметок.',
        proMode: 'Быстрый Pro-режим',
        proHint: 'Просит ИИ отдавать приоритет авторитетным академическим, научным, государственным, медицинским, юридическим и издательским источникам.',
        dictationSettings: 'Настройки диктовки',
        speechLanguage: 'Язык речи',
        continuousListening: 'Непрерывное прослушивание',
        interimRecognition: 'Использовать промежуточное распознавание',
        testDictation: 'Проверить диктовку',
        dictationHint: 'Использует распознавание речи браузера и системный микрофон.',
        uiLanguage: 'Язык интерфейса',
        uiLanguageHint: 'Меняет только подписи интерфейса; ИИ уже умеет работать с многоязычными заметками.',
        about: 'О программе',
        help: 'Помощь',
        feedback: 'Отправить отзыв',
        headingPlaceholder: 'Заголовок Cornell-заметки',
        headingColor: 'Заголовок',
        textColor: 'Текст',
        cueColumn: 'Колонка подсказок',
        cuePlaceholder: 'Подсказки, ключевые слова, ключевые вопросы',
        summary: 'Итог',
        summaryPlaceholder: 'Введите итог здесь...',
        llmInsights: 'LLM-анализ',
        overview: 'Обзор',
        analysis: 'Анализ',
        concepts: 'Понятия',
        suggestedLinks: 'Предложенные связи',
        seeAlso: 'См. также',
        videos: 'Видео',
        cell: 'Ячейка',
        addBox: '+ Добавить ячейку',
        deleteBox: '− Удалить ячейку',
        duplicateBox: '* Дублировать ячейку',
        linkSystem: 'Система связей',
        openServer: 'Открыть с сервера',
        refresh: 'Обновить',
        close: 'Закрыть',
        helpTitle: 'Помощь и инструкции',
        howToUse: 'Как использовать TreeNotes:',
        helpAddBoxes: 'Добавить ячейки:',
        helpAddBoxesText: 'Нажмите ➕ на панели инструментов, чтобы добавить заметку.',
        helpLinkBoxes: 'Связать ячейки:',
        helpLinkBoxesText: 'Выберите ячейку, откройте систему связей и выберите другую ячейку.',
        helpAnalyzeAi: 'AI-анализ:',
        helpAnalyzeAiText: 'Нажмите 🤖, чтобы получить AI-анализ заметок.',
        aboutTitle: 'О TreeNotes',
        feedbackTitle: 'Отправить отзыв',
        feedbackMessage: 'Сообщение для команды разработки',
        feedbackPlaceholder: 'Опишите проблему, идею или workflow для улучшения.',
        feedbackHint: 'Эта beta откроет ваше почтовое приложение с сообщением.',
        openEmail: 'Открыть email',
        forumsDiscord: 'Форумы/Discord',
        languageApplied: 'Язык интерфейса обновлён.'
    },
    ja: {
        appTitle: 'ツリーノート',
        menuTitle: '📘 TreeNotes',
        new: '新規',
        cloudOpen: 'クラウドから開く',
        cloudSave: 'クラウドに保存',
        localOpen: 'ローカルから開く',
        localSave: 'ローカルに保存',
        toggleTheme: 'ライト/ダーク切替',
        aiSettings: 'AI 設定',
        aiProvider: 'AI プロバイダー',
        aiModel: 'AI モデル',
        geminiKey: 'Gemini API キー',
        openaiKey: 'OpenAI API キー',
        ollamaUrl: 'Ollama URL',
        backendUrl: 'Backend API URL',
        aiHint: 'キーはバックエンド分析 endpoint にのみ送信され、ノートファイルには保存されません。',
        proMode: 'クイック Pro モード',
        proHint: 'AI に権威ある学術・科学・政府・医療・法律・出版社の情報源を優先させます。',
        dictationSettings: '音声入力設定',
        speechLanguage: '音声言語',
        continuousListening: '連続リスニング',
        interimRecognition: '途中認識を使用',
        testDictation: '音声入力をテスト',
        dictationHint: 'ブラウザの音声認識とシステムマイクを使用します。',
        uiLanguage: 'UI 言語',
        uiLanguageHint: 'インターフェースのラベルのみ変更します。AI は多言語ノートに対応しています。',
        about: '情報',
        help: 'ヘルプ',
        feedback: 'フィードバック送信',
        headingPlaceholder: 'Cornell ノート見出し',
        headingColor: '見出し',
        textColor: 'テキスト',
        cueColumn: 'キュー欄',
        cuePlaceholder: 'キュー、キーワード、重要な質問',
        summary: '要約',
        summaryPlaceholder: 'ここに要約を入力...',
        llmInsights: 'LLM インサイト',
        overview: '概要',
        analysis: '分析',
        concepts: '概念',
        suggestedLinks: '提案リンク',
        seeAlso: '関連情報',
        videos: '動画',
        cell: 'セル',
        addBox: '+ セル追加',
        deleteBox: '− セル削除',
        duplicateBox: '* セル複製',
        linkSystem: 'リンクシステム',
        openServer: 'サーバーから開く',
        refresh: '更新',
        close: '閉じる',
        helpTitle: 'ヘルプと手順',
        howToUse: 'TreeNotes の使い方:',
        helpAddBoxes: 'セルを追加:',
        helpAddBoxesText: 'ツールバーの ➕ をクリックしてノートを追加します。',
        helpLinkBoxes: 'セルをリンク:',
        helpLinkBoxesText: 'セルを選択し、リンクシステムを開いて別のセルを選びます。',
        helpAnalyzeAi: 'AI 分析:',
        helpAnalyzeAiText: '🤖 をクリックしてノートの AI インサイトを取得します。',
        aboutTitle: 'TreeNotes について',
        feedbackTitle: 'フィードバック送信',
        feedbackMessage: '開発チームへのメッセージ',
        feedbackPlaceholder: '改善したい問題、アイデア、ワークフローを説明してください。',
        feedbackHint: 'この beta はメールアプリでメッセージを開きます。',
        openEmail: 'メールを開く',
        forumsDiscord: 'フォーラム/Discord',
        languageApplied: 'インターフェース言語を更新しました。'
    },
    ar: {
        appTitle: 'ملاحظات شجرية',
        menuTitle: '📘 TreeNotes',
        new: 'جديد',
        cloudOpen: 'فتح من السحابة',
        cloudSave: 'حفظ في السحابة',
        localOpen: 'فتح محلي',
        localSave: 'حفظ محلي',
        toggleTheme: 'تبديل الوضع الفاتح/الداكن',
        aiSettings: 'إعدادات الذكاء الاصطناعي',
        aiProvider: 'مزود الذكاء الاصطناعي',
        aiModel: 'نموذج الذكاء الاصطناعي',
        geminiKey: 'مفتاح Gemini API',
        openaiKey: 'مفتاح OpenAI API',
        ollamaUrl: 'رابط Ollama',
        backendUrl: 'رابط API الخلفي',
        aiHint: 'تُرسل المفاتيح فقط إلى نقطة تحليل الخلفية ولا تُحفظ داخل ملفات الملاحظات.',
        proMode: 'وضع احترافي سريع',
        proHint: 'يوجه الذكاء الاصطناعي لتفضيل المصادر الأكاديمية والعلمية والحكومية والطبية والقانونية والناشرين الموثوقين.',
        dictationSettings: 'إعدادات الإملاء',
        speechLanguage: 'لغة الكلام',
        continuousListening: 'استماع مستمر',
        interimRecognition: 'استخدام التعرف المؤقت',
        testDictation: 'اختبار الإملاء',
        dictationHint: 'يستخدم تعرف الكلام في المتصفح وميكروفون النظام الحالي.',
        uiLanguage: 'لغة الواجهة',
        uiLanguageHint: 'يغير تسميات الواجهة فقط؛ يستطيع الذكاء الاصطناعي معالجة الملاحظات متعددة اللغات.',
        about: 'حول',
        help: 'مساعدة',
        feedback: 'إرسال ملاحظات',
        headingPlaceholder: 'عنوان ملاحظة كورنيل',
        headingColor: 'العنوان',
        textColor: 'النص',
        cueColumn: 'عمود الإشارات',
        cuePlaceholder: 'إشارات، كلمات مفتاحية، أسئلة رئيسية',
        summary: 'ملخص',
        summaryPlaceholder: 'اكتب الملخص هنا...',
        llmInsights: 'رؤى LLM',
        overview: 'نظرة عامة',
        analysis: 'تحليل',
        concepts: 'مفاهيم',
        suggestedLinks: 'روابط مقترحة',
        seeAlso: 'انظر أيضًا',
        videos: 'فيديوهات',
        cell: 'خلية',
        addBox: '+ إضافة خلية',
        deleteBox: '− حذف خلية',
        duplicateBox: '* نسخ خلية',
        linkSystem: 'نظام الروابط',
        openServer: 'فتح من الخادم',
        refresh: 'تحديث',
        close: 'إغلاق',
        helpTitle: 'المساعدة والتعليمات',
        howToUse: 'كيفية استخدام TreeNotes:',
        helpAddBoxes: 'إضافة خلايا:',
        helpAddBoxesText: 'انقر على ➕ في شريط الأدوات لإضافة ملاحظة جديدة.',
        helpLinkBoxes: 'ربط الخلايا:',
        helpLinkBoxesText: 'حدد خلية، افتح نظام الروابط، ثم اختر خلية أخرى.',
        helpAnalyzeAi: 'تحليل الذكاء الاصطناعي:',
        helpAnalyzeAiText: 'انقر على 🤖 للحصول على رؤى AI حول ملاحظاتك.',
        aboutTitle: 'حول TreeNotes',
        feedbackTitle: 'إرسال ملاحظات',
        feedbackMessage: 'رسالة إلى فريق التطوير',
        feedbackPlaceholder: 'صف المشكلة أو الفكرة أو سير العمل الذي تريد تحسينه.',
        feedbackHint: 'يفتح هذا الإصدار التجريبي تطبيق البريد لديك مع الرسالة.',
        openEmail: 'فتح البريد',
        forumsDiscord: 'المنتديات/Discord',
        languageApplied: 'تم تحديث لغة الواجهة.'
    },
    he: {
        appTitle: 'הערות עץ',
        menuTitle: '📘 TreeNotes',
        new: 'חדש',
        cloudOpen: 'פתח מהענן',
        cloudSave: 'שמור בענן',
        localOpen: 'פתח מקומית',
        localSave: 'שמור מקומית',
        toggleTheme: 'החלף מצב בהיר/כהה',
        aiSettings: 'הגדרות AI',
        aiProvider: 'ספק AI',
        aiModel: 'מודל AI',
        geminiKey: 'מפתח Gemini API',
        openaiKey: 'מפתח OpenAI API',
        ollamaUrl: 'כתובת Ollama',
        backendUrl: 'כתובת Backend API',
        aiHint: 'המפתחות נשלחים רק לנקודת ניתוח backend ולא נשמרים בקבצי ההערות.',
        proMode: 'מצב Pro מהיר',
        proHint: 'מנחה את ה-AI לתעדף מקורות אקדמיים, מדעיים, ממשלתיים, רפואיים, משפטיים והוצאתיים סמכותיים.',
        dictationSettings: 'הגדרות הכתבה',
        speechLanguage: 'שפת דיבור',
        continuousListening: 'האזנה רציפה',
        interimRecognition: 'השתמש בזיהוי ביניים',
        testDictation: 'בדוק הכתבה',
        dictationHint: 'משתמש בזיהוי דיבור של הדפדפן ובמיקרופון המערכת.',
        uiLanguage: 'שפת ממשק',
        uiLanguageHint: 'משנה רק תוויות ממשק; ה-AI כבר יכול לעבוד עם הערות רב-לשוניות.',
        about: 'אודות',
        help: 'עזרה',
        feedback: 'שלח משוב',
        headingPlaceholder: 'כותרת הערת Cornell',
        headingColor: 'כותרת',
        textColor: 'טקסט',
        cueColumn: 'עמודת רמזים',
        cuePlaceholder: 'רמזים, מילות מפתח, שאלות מרכזיות',
        summary: 'סיכום',
        summaryPlaceholder: 'הקלד כאן סיכום...',
        llmInsights: 'תובנות LLM',
        overview: 'סקירה',
        analysis: 'ניתוח',
        concepts: 'מושגים',
        suggestedLinks: 'קישורים מוצעים',
        seeAlso: 'ראו גם',
        videos: 'סרטונים',
        cell: 'תא',
        addBox: '+ הוסף תא',
        deleteBox: '− מחק תא',
        duplicateBox: '* שכפל תא',
        linkSystem: 'מערכת קישורים',
        openServer: 'פתח מהשרת',
        refresh: 'רענן',
        close: 'סגור',
        helpTitle: 'עזרה והוראות',
        howToUse: 'איך להשתמש ב-TreeNotes:',
        helpAddBoxes: 'הוסף תאים:',
        helpAddBoxesText: 'לחץ על ➕ בסרגל הכלים כדי להוסיף הערה חדשה.',
        helpLinkBoxes: 'קשר תאים:',
        helpLinkBoxesText: 'בחר תא, פתח את מערכת הקישורים ובחר תא אחר.',
        helpAnalyzeAi: 'ניתוח AI:',
        helpAnalyzeAiText: 'לחץ על 🤖 כדי לקבל תובנות AI על ההערות שלך.',
        aboutTitle: 'אודות TreeNotes',
        feedbackTitle: 'שלח משוב',
        feedbackMessage: 'הודעה לצוות הפיתוח',
        feedbackPlaceholder: 'תאר בעיה, רעיון או תהליך שתרצה לשפר.',
        feedbackHint: 'גרסת beta זו פותחת את אפליקציית הדוא״ל עם ההודעה.',
        openEmail: 'פתח דוא״ל',
        forumsDiscord: 'פורומים/Discord',
        languageApplied: 'שפת הממשק עודכנה.'
    }
};
Object.assign(UI_TRANSLATIONS, {
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
});
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'yi']);
const UI_LANGUAGE_ALIASES = {
    'en-us': 'en',
    'en-gb': 'en',
    'en-au': 'en',
    'fr-fr': 'fr',
    'de-de': 'de',
    'es-es': 'es',
    'it-it': 'it',
    'pt-br': 'pt',
    'pt-pt': 'pt',
    'el-gr': 'el',
    'vi-vn': 'vi',
    'zh-cn': 'zh',
    'zh-hans': 'zh',
    'cmn': 'zh',
    'ru-ru': 'ru',
    'ja-jp': 'ja',
    'ko-kr': 'ko',
    'id-id': 'id',
    'in': 'id',
    'ar-sa': 'ar',
    'ar-ae': 'ar',
    'fa-ir': 'fa',
    'pes': 'fa',
    'prs': 'fa',
    'he-il': 'he',
    'iw': 'he',
    'yi-001': 'yi',
    'ji': 'yi'
};
const UI_TOOL_TITLE_TRANSLATIONS = {
    fr: {
        addBoxTitle: 'Ajouter une cellule',
        zoomInTitle: 'Zoom avant',
        zoomOutTitle: 'Zoom arrière',
        gridTitle: 'Afficher/masquer la grille',
        dictationTitle: 'Activer la dictée',
        analyzeTitle: 'Analyser les notes via API',
        coachTitle: 'Mode coach de révision',
        downloadTitle: 'Télécharger les notes',
        uploadTitle: 'Importer des notes',
        noteInfoTitle: 'Infos de la note'
    },
    de: {
        addBoxTitle: 'Zelle hinzufügen',
        zoomInTitle: 'Vergrößern',
        zoomOutTitle: 'Verkleinern',
        gridTitle: 'Hilfsraster umschalten',
        dictationTitle: 'Diktat umschalten',
        analyzeTitle: 'Notizen per API analysieren',
        coachTitle: 'Coach-Modus Lernquiz',
        downloadTitle: 'Notizen herunterladen',
        uploadTitle: 'Notizen hochladen',
        noteInfoTitle: 'Notizinfo'
    },
    es: {
        addBoxTitle: 'Añadir celda',
        zoomInTitle: 'Acercar',
        zoomOutTitle: 'Alejar',
        gridTitle: 'Alternar cuadrícula guía',
        dictationTitle: 'Activar dictado',
        analyzeTitle: 'Analizar notas vía API',
        coachTitle: 'Modo Coach de estudio',
        downloadTitle: 'Descargar notas',
        uploadTitle: 'Subir notas',
        noteInfoTitle: 'Información de nota'
    },
    it: {
        addBoxTitle: 'Aggiungi cella',
        zoomInTitle: 'Zoom avanti',
        zoomOutTitle: 'Zoom indietro',
        gridTitle: 'Attiva griglia guida',
        dictationTitle: 'Attiva dettatura',
        analyzeTitle: 'Analizza note via API',
        coachTitle: 'Modalità coach studio',
        downloadTitle: 'Scarica note',
        uploadTitle: 'Carica note',
        noteInfoTitle: 'Info nota'
    },
    pt: {
        addBoxTitle: 'Adicionar célula',
        zoomInTitle: 'Aumentar zoom',
        zoomOutTitle: 'Diminuir zoom',
        gridTitle: 'Alternar grade guia',
        dictationTitle: 'Alternar ditado',
        analyzeTitle: 'Analisar notas via API',
        coachTitle: 'Modo Coach: quiz de estudo',
        downloadTitle: 'Baixar notas',
        uploadTitle: 'Enviar notas',
        noteInfoTitle: 'Informações da nota'
    },
    el: {
        addBoxTitle: 'Προσθήκη κελιού',
        zoomInTitle: 'Μεγέθυνση',
        zoomOutTitle: 'Σμίκρυνση',
        gridTitle: 'Εναλλαγή πλέγματος οδηγού',
        dictationTitle: 'Εναλλαγή υπαγόρευσης',
        analyzeTitle: 'Ανάλυση σημειώσεων μέσω API',
        coachTitle: 'Λειτουργία Coach: κουίζ μελέτης',
        downloadTitle: 'Λήψη σημειώσεων',
        uploadTitle: 'Μεταφόρτωση σημειώσεων',
        noteInfoTitle: 'Πληροφορίες σημείωσης'
    },
    vi: {
        addBoxTitle: 'Thêm ô',
        zoomInTitle: 'Phóng to',
        zoomOutTitle: 'Thu nhỏ',
        gridTitle: 'Bật/tắt lưới hướng dẫn',
        dictationTitle: 'Bật/tắt đọc chính tả',
        analyzeTitle: 'Phân tích ghi chú qua API',
        coachTitle: 'Chế độ Coach: câu hỏi ôn tập',
        downloadTitle: 'Tải ghi chú xuống',
        uploadTitle: 'Tải ghi chú lên',
        noteInfoTitle: 'Thông tin ghi chú'
    },
    zh: {
        addBoxTitle: '添加单元格',
        zoomInTitle: '放大',
        zoomOutTitle: '缩小',
        gridTitle: '切换辅助网格',
        dictationTitle: '切换听写',
        analyzeTitle: '通过 API 分析笔记',
        coachTitle: '教练模式学习测验',
        downloadTitle: '下载笔记',
        uploadTitle: '上传笔记',
        noteInfoTitle: '笔记信息'
    },
    ru: {
        addBoxTitle: 'Добавить ячейку',
        zoomInTitle: 'Увеличить',
        zoomOutTitle: 'Уменьшить',
        gridTitle: 'Показать/скрыть сетку',
        dictationTitle: 'Включить диктовку',
        analyzeTitle: 'Анализировать заметки через API',
        coachTitle: 'Учебная викторина Coach Mode',
        downloadTitle: 'Скачать заметки',
        uploadTitle: 'Загрузить заметки',
        noteInfoTitle: 'Информация о заметке'
    },
    ja: {
        addBoxTitle: 'セルを追加',
        zoomInTitle: 'ズームイン',
        zoomOutTitle: 'ズームアウト',
        gridTitle: 'ガイドグリッド切替',
        dictationTitle: '音声入力切替',
        analyzeTitle: 'API でノートを分析',
        coachTitle: 'Coach Mode 学習クイズ',
        downloadTitle: 'ノートをダウンロード',
        uploadTitle: 'ノートをアップロード',
        noteInfoTitle: 'ノート情報'
    },
    ko: {
        addBoxTitle: '셀 추가',
        zoomInTitle: '확대',
        zoomOutTitle: '축소',
        gridTitle: '가이드 격자 전환',
        dictationTitle: '받아쓰기 전환',
        analyzeTitle: 'API로 노트 분석',
        coachTitle: 'Coach 모드 학습 퀴즈',
        downloadTitle: '노트 다운로드',
        uploadTitle: '노트 업로드',
        noteInfoTitle: '노트 정보'
    },
    id: {
        addBoxTitle: 'Tambah sel',
        zoomInTitle: 'Perbesar',
        zoomOutTitle: 'Perkecil',
        gridTitle: 'Alihkan grid panduan',
        dictationTitle: 'Alihkan dikte',
        analyzeTitle: 'Analisis catatan via API',
        coachTitle: 'Mode Coach kuis belajar',
        downloadTitle: 'Unduh catatan',
        uploadTitle: 'Unggah catatan',
        noteInfoTitle: 'Info catatan'
    },
    ar: {
        addBoxTitle: 'إضافة خلية',
        zoomInTitle: 'تكبير',
        zoomOutTitle: 'تصغير',
        gridTitle: 'تبديل شبكة الإرشاد',
        dictationTitle: 'تبديل الإملاء',
        analyzeTitle: 'تحليل الملاحظات عبر API',
        coachTitle: 'اختبار وضع المدرب',
        downloadTitle: 'تنزيل الملاحظات',
        uploadTitle: 'رفع الملاحظات',
        noteInfoTitle: 'معلومات الملاحظة'
    },
    fa: {
        addBoxTitle: 'افزودن سلول',
        zoomInTitle: 'بزرگ‌نمایی',
        zoomOutTitle: 'کوچک‌نمایی',
        gridTitle: 'تغییر شبکه راهنما',
        dictationTitle: 'تغییر گفتار به متن',
        analyzeTitle: 'تحلیل یادداشت‌ها با API',
        coachTitle: 'حالت Coach: آزمون مطالعه',
        downloadTitle: 'دانلود یادداشت‌ها',
        uploadTitle: 'آپلود یادداشت‌ها',
        noteInfoTitle: 'اطلاعات یادداشت'
    },
    he: {
        addBoxTitle: 'הוסף תא',
        zoomInTitle: 'התקרב',
        zoomOutTitle: 'התרחק',
        gridTitle: 'החלף רשת עזר',
        dictationTitle: 'החלף הכתבה',
        analyzeTitle: 'נתח הערות דרך API',
        coachTitle: 'חידון מצב מאמן',
        downloadTitle: 'הורד הערות',
        uploadTitle: 'העלה הערות',
        noteInfoTitle: 'מידע על ההערה'
    },
    yi: {
        addBoxTitle: 'צולייגן צעל',
        zoomInTitle: 'פֿאַרגרעסערן',
        zoomOutTitle: 'פֿאַרקלעענערן',
        gridTitle: 'בייטן הילף־גריד',
        dictationTitle: 'בייטן דיקטאַציע',
        analyzeTitle: 'אַנאַליזירן נאָטיצן דורך API',
        coachTitle: 'Coach מאָדוס לערן־קוויז',
        downloadTitle: 'אַראָפּלאָדן נאָטיצן',
        uploadTitle: 'אַרויפֿלאָדן נאָטיצן',
        noteInfoTitle: 'נאָטיץ אינפֿאָרמאַציע'
    }
};
for (const [language, labels] of Object.entries(UI_TOOL_TITLE_TRANSLATIONS)) {
    Object.assign(UI_TRANSLATIONS[language], labels);
}
const UI_STATUS_TRANSLATIONS = {
    en: {
        openBeta: 'Open Beta',
        info: 'Info',
        openMenu: 'Open menu',
        stopDictationTitle: 'Stop dictation',
        dictationStopped: 'Dictation stopped.',
        dictationUnsupported: 'Dictation is not supported in this browser. Try Chrome or Edge.',
        dictationSelectTarget: 'Click a text field or note box before starting dictation.',
        dictationActive: 'Dictation active. Speak now; recognized text goes into the selected field.',
        forumsUnavailable: 'Forums/Discord link is not configured in this beta build.',
        feedbackSubject: 'TreeNotes beta feedback',
        feedbackBodyFallback: 'Feedback: ',
        analysisComplete: 'Analysis complete.',
        analysisUnavailable: 'Server AI is off. Add GEMINI_API_KEY (or set AI_PROVIDER) on the API host, then retry.',
        analysisFailed: 'Analysis failed.',
        apiUnreachable: 'Could not reach {url}. Check API URL in the menu and that the backend is running.',
        savingToServer: 'Saving to server...',
        savedToServer: 'Saved to server.',
        saveFailedPrefix: 'Save failed: ',
        loadingFromServer: 'Loading from server...',
        loadedFromServer: 'Loaded from server.',
        loadFailedPrefix: 'Load failed: ',
        noteNotFound: 'Note not found on server.',
        noNotesYet: 'No notes yet.',
        noTitle: '(no title)',
        newNoteUnsaved: 'New note (not saved to server yet).',
        loadedFromFile: 'Loaded from file.',
        dictationEnded: 'Dictation ended.',
        dictationStartFailed: 'Dictation could not start. Try clicking a text field first.',
        callingAnalysisApi: 'Calling analysis API...',
        callingCoachApi: 'Calling Coach Mode API...',
        coachReady: 'Coach Mode ready.',
        coachLocal: 'Coach Mode opened with local puzzles.',
        coachUnavailable: 'Coach API unavailable. Opened local coach puzzles.',
        comingSoon: 'Coming soon!'
    },
    fr: {
        openBeta: 'Bêta ouverte', info: 'Infos', openMenu: 'Ouvrir le menu', stopDictationTitle: 'Arrêter la dictée', dictationStopped: 'Dictée arrêtée.', dictationUnsupported: 'La dictée n’est pas prise en charge dans ce navigateur. Essayez Chrome ou Edge.', dictationSelectTarget: 'Cliquez dans un champ de texte ou une cellule de note avant de démarrer la dictée.', dictationActive: 'Dictée active. Parlez maintenant ; le texte reconnu sera inséré dans le champ sélectionné.', forumsUnavailable: 'Le lien Forums/Discord n’est pas configuré dans cette version bêta.', feedbackSubject: 'Retour bêta TreeNotes', feedbackBodyFallback: 'Retour : ', analysisComplete: 'Analyse terminée.', analysisUnavailable: 'L’IA serveur est désactivée. Ajoutez GEMINI_API_KEY (ou définissez AI_PROVIDER) sur l’hôte API, puis réessayez.', analysisFailed: 'Échec de l’analyse.', apiUnreachable: 'Impossible de joindre {url}. Vérifiez l’URL API dans le menu et que le backend fonctionne.', savingToServer: 'Enregistrement sur le serveur...', savedToServer: 'Enregistré sur le serveur.', saveFailedPrefix: 'Échec de l’enregistrement : ', loadingFromServer: 'Chargement depuis le serveur...', loadedFromServer: 'Chargé depuis le serveur.', loadFailedPrefix: 'Échec du chargement : ', noteNotFound: 'Note introuvable sur le serveur.', noNotesYet: 'Aucune note pour le moment.', noTitle: '(sans titre)', newNoteUnsaved: 'Nouvelle note (pas encore enregistrée sur le serveur).', loadedFromFile: 'Chargé depuis le fichier.', dictationEnded: 'Dictée terminée.', dictationStartFailed: 'Impossible de démarrer la dictée. Essayez d’abord de cliquer dans un champ de texte.', callingAnalysisApi: 'Appel de l’API d’analyse...', callingCoachApi: 'Appel de l’API Coach Mode...', coachReady: 'Coach Mode prêt.', coachLocal: 'Coach Mode ouvert avec des exercices locaux.', coachUnavailable: 'API Coach indisponible. Exercices locaux ouverts.', comingSoon: 'Bientôt disponible !'
    },
    de: {
        openBeta: 'Offene Beta', info: 'Info', openMenu: 'Menü öffnen', stopDictationTitle: 'Diktat stoppen', dictationStopped: 'Diktat gestoppt.', dictationUnsupported: 'Diktat wird in diesem Browser nicht unterstützt. Versuchen Sie Chrome oder Edge.', dictationSelectTarget: 'Klicken Sie in ein Textfeld oder eine Notizzelle, bevor Sie das Diktat starten.', dictationActive: 'Diktat aktiv. Sprechen Sie jetzt; erkannter Text wird in das ausgewählte Feld eingefügt.', forumsUnavailable: 'Der Foren/Discord-Link ist in dieser Beta-Version nicht konfiguriert.', feedbackSubject: 'TreeNotes Beta-Feedback', feedbackBodyFallback: 'Feedback: ', analysisComplete: 'Analyse abgeschlossen.', analysisUnavailable: 'Server-KI ist deaktiviert. Fügen Sie GEMINI_API_KEY hinzu (oder setzen Sie AI_PROVIDER) und versuchen Sie es erneut.', analysisFailed: 'Analyse fehlgeschlagen.', apiUnreachable: '{url} konnte nicht erreicht werden. Prüfen Sie die API-URL im Menü und ob das Backend läuft.', savingToServer: 'Speichern auf dem Server...', savedToServer: 'Auf dem Server gespeichert.', saveFailedPrefix: 'Speichern fehlgeschlagen: ', loadingFromServer: 'Laden vom Server...', loadedFromServer: 'Vom Server geladen.', loadFailedPrefix: 'Laden fehlgeschlagen: ', noteNotFound: 'Notiz auf dem Server nicht gefunden.', noNotesYet: 'Noch keine Notizen.', noTitle: '(ohne Titel)', newNoteUnsaved: 'Neue Notiz (noch nicht auf dem Server gespeichert).', loadedFromFile: 'Aus Datei geladen.', dictationEnded: 'Diktat beendet.', dictationStartFailed: 'Diktat konnte nicht gestartet werden. Klicken Sie zuerst in ein Textfeld.', callingAnalysisApi: 'Analyse-API wird aufgerufen...', callingCoachApi: 'Coach-Mode-API wird aufgerufen...', coachReady: 'Coach Mode bereit.', coachLocal: 'Coach Mode mit lokalen Übungen geöffnet.', coachUnavailable: 'Coach-API nicht verfügbar. Lokale Übungen wurden geöffnet.', comingSoon: 'Demnächst!'
    },
    es: {
        openBeta: 'Beta abierta', info: 'Información', openMenu: 'Abrir menú', stopDictationTitle: 'Detener dictado', dictationStopped: 'Dictado detenido.', dictationUnsupported: 'El dictado no es compatible con este navegador. Prueba Chrome o Edge.', dictationSelectTarget: 'Haz clic en un campo de texto o celda de nota antes de iniciar el dictado.', dictationActive: 'Dictado activo. Habla ahora; el texto reconocido irá al campo seleccionado.', forumsUnavailable: 'El enlace de Foros/Discord no está configurado en esta versión beta.', feedbackSubject: 'Comentarios beta de TreeNotes', feedbackBodyFallback: 'Comentarios: ', analysisComplete: 'Análisis completado.', analysisUnavailable: 'La IA del servidor está desactivada. Añade GEMINI_API_KEY (o configura AI_PROVIDER) en el host de la API y vuelve a intentarlo.', analysisFailed: 'El análisis falló.', apiUnreachable: 'No se pudo acceder a {url}. Revisa la URL de API en el menú y que el backend esté ejecutándose.', savingToServer: 'Guardando en el servidor...', savedToServer: 'Guardado en el servidor.', saveFailedPrefix: 'Error al guardar: ', loadingFromServer: 'Cargando desde el servidor...', loadedFromServer: 'Cargado desde el servidor.', loadFailedPrefix: 'Error al cargar: ', noteNotFound: 'Nota no encontrada en el servidor.', noNotesYet: 'Aún no hay notas.', noTitle: '(sin título)', newNoteUnsaved: 'Nueva nota (aún no guardada en el servidor).', loadedFromFile: 'Cargado desde archivo.', dictationEnded: 'Dictado finalizado.', dictationStartFailed: 'No se pudo iniciar el dictado. Intenta hacer clic primero en un campo de texto.', callingAnalysisApi: 'Llamando a la API de análisis...', callingCoachApi: 'Llamando a la API de Coach Mode...', coachReady: 'Coach Mode listo.', coachLocal: 'Coach Mode abierto con ejercicios locales.', coachUnavailable: 'API de Coach no disponible. Se abrieron ejercicios locales.', comingSoon: '¡Próximamente!'
    },
    it: {
        openBeta: 'Beta aperta', info: 'Info', openMenu: 'Apri menu', stopDictationTitle: 'Ferma dettatura', dictationStopped: 'Dettatura fermata.', dictationUnsupported: 'La dettatura non è supportata in questo browser. Prova Chrome o Edge.', dictationSelectTarget: 'Fai clic in un campo di testo o in una cella nota prima di avviare la dettatura.', dictationActive: 'Dettatura attiva. Parla ora; il testo riconosciuto verrà inserito nel campo selezionato.', forumsUnavailable: 'Il link Forum/Discord non è configurato in questa beta.', feedbackSubject: 'Feedback beta TreeNotes', feedbackBodyFallback: 'Feedback: ', analysisComplete: 'Analisi completata.', analysisUnavailable: 'L’IA del server è disattivata. Aggiungi GEMINI_API_KEY (o imposta AI_PROVIDER) sull’host API e riprova.', analysisFailed: 'Analisi non riuscita.', apiUnreachable: 'Impossibile raggiungere {url}. Controlla l’URL API nel menu e che il backend sia in esecuzione.', savingToServer: 'Salvataggio sul server...', savedToServer: 'Salvato sul server.', saveFailedPrefix: 'Salvataggio non riuscito: ', loadingFromServer: 'Caricamento dal server...', loadedFromServer: 'Caricato dal server.', loadFailedPrefix: 'Caricamento non riuscito: ', noteNotFound: 'Nota non trovata sul server.', noNotesYet: 'Ancora nessuna nota.', noTitle: '(senza titolo)', newNoteUnsaved: 'Nuova nota (non ancora salvata sul server).', loadedFromFile: 'Caricato da file.', dictationEnded: 'Dettatura terminata.', dictationStartFailed: 'Impossibile avviare la dettatura. Prova prima a fare clic in un campo di testo.', callingAnalysisApi: 'Chiamata API di analisi...', callingCoachApi: 'Chiamata API Coach Mode...', coachReady: 'Coach Mode pronto.', coachLocal: 'Coach Mode aperto con esercizi locali.', coachUnavailable: 'API Coach non disponibile. Esercizi locali aperti.', comingSoon: 'In arrivo!'
    },
    pt: {
        openBeta: 'Beta aberta', info: 'Informações', openMenu: 'Abrir menu', stopDictationTitle: 'Parar ditado', dictationStopped: 'Ditado parado.', dictationUnsupported: 'Ditado não é compatível com este navegador. Tente Chrome ou Edge.', dictationSelectTarget: 'Clique em um campo de texto ou célula de nota antes de iniciar o ditado.', dictationActive: 'Ditado ativo. Fale agora; o texto reconhecido entra no campo selecionado.', forumsUnavailable: 'O link de Fóruns/Discord não está configurado nesta versão beta.', feedbackSubject: 'Feedback beta do TreeNotes', feedbackBodyFallback: 'Feedback: ', analysisComplete: 'Análise concluída.', analysisUnavailable: 'A IA do servidor está desligada. Adicione GEMINI_API_KEY (ou defina AI_PROVIDER) no host da API e tente novamente.', analysisFailed: 'Falha na análise.', apiUnreachable: 'Não foi possível acessar {url}. Verifique a URL da API no menu e se o backend está em execução.', savingToServer: 'Salvando no servidor...', savedToServer: 'Salvo no servidor.', saveFailedPrefix: 'Falha ao salvar: ', loadingFromServer: 'Carregando do servidor...', loadedFromServer: 'Carregado do servidor.', loadFailedPrefix: 'Falha ao carregar: ', noteNotFound: 'Nota não encontrada no servidor.', noNotesYet: 'Ainda não há notas.', noTitle: '(sem título)', newNoteUnsaved: 'Nova nota (ainda não salva no servidor).', loadedFromFile: 'Carregado do arquivo.', dictationEnded: 'Ditado encerrado.', dictationStartFailed: 'Não foi possível iniciar o ditado. Tente clicar primeiro em um campo de texto.', callingAnalysisApi: 'Chamando API de análise...', callingCoachApi: 'Chamando API do Coach Mode...', coachReady: 'Coach Mode pronto.', coachLocal: 'Coach Mode aberto com exercícios locais.', coachUnavailable: 'API do Coach indisponível. Exercícios locais foram abertos.', comingSoon: 'Em breve!'
    },
    ru: {
        openBeta: 'Открытая бета', info: 'Информация', openMenu: 'Открыть меню', stopDictationTitle: 'Остановить диктовку', dictationStopped: 'Диктовка остановлена.', dictationUnsupported: 'Диктовка не поддерживается в этом браузере. Попробуйте Chrome или Edge.', dictationSelectTarget: 'Перед запуском диктовки нажмите текстовое поле или ячейку заметки.', dictationActive: 'Диктовка активна. Говорите; распознанный текст попадёт в выбранное поле.', forumsUnavailable: 'Ссылка на форумы/Discord не настроена в этой beta-версии.', feedbackSubject: 'Отзыв о beta TreeNotes', feedbackBodyFallback: 'Отзыв: ', analysisComplete: 'Анализ завершён.', analysisUnavailable: 'Серверный ИИ выключен. Добавьте GEMINI_API_KEY (или задайте AI_PROVIDER) на API-хосте и повторите попытку.', analysisFailed: 'Анализ не удался.', apiUnreachable: 'Не удалось подключиться к {url}. Проверьте URL API в меню и убедитесь, что backend запущен.', savingToServer: 'Сохранение на сервер...', savedToServer: 'Сохранено на сервере.', saveFailedPrefix: 'Ошибка сохранения: ', loadingFromServer: 'Загрузка с сервера...', loadedFromServer: 'Загружено с сервера.', loadFailedPrefix: 'Ошибка загрузки: ', noteNotFound: 'Заметка не найдена на сервере.', noNotesYet: 'Заметок пока нет.', noTitle: '(без названия)', newNoteUnsaved: 'Новая заметка (ещё не сохранена на сервере).', loadedFromFile: 'Загружено из файла.', dictationEnded: 'Диктовка завершена.', dictationStartFailed: 'Не удалось запустить диктовку. Сначала нажмите текстовое поле.', callingAnalysisApi: 'Вызов API анализа...', callingCoachApi: 'Вызов API Coach Mode...', coachReady: 'Coach Mode готов.', coachLocal: 'Coach Mode открыт с локальными заданиями.', coachUnavailable: 'API Coach недоступен. Открыты локальные задания.', comingSoon: 'Скоро!'
    },
    el: {
        openBeta: 'Ανοιχτή beta', info: 'Πληροφορίες', openMenu: 'Άνοιγμα μενού', stopDictationTitle: 'Διακοπή υπαγόρευσης', dictationStopped: 'Η υπαγόρευση σταμάτησε.', dictationUnsupported: 'Η υπαγόρευση δεν υποστηρίζεται σε αυτό το πρόγραμμα περιήγησης. Δοκιμάστε Chrome ή Edge.', dictationSelectTarget: 'Κάντε κλικ σε πεδίο κειμένου ή κελί σημείωσης πριν ξεκινήσετε την υπαγόρευση.', dictationActive: 'Η υπαγόρευση είναι ενεργή. Μιλήστε τώρα· το αναγνωρισμένο κείμενο θα μπει στο επιλεγμένο πεδίο.', forumsUnavailable: 'Ο σύνδεσμος Φόρουμ/Discord δεν έχει ρυθμιστεί σε αυτήν την beta έκδοση.', feedbackSubject: 'Σχόλια beta για το TreeNotes', feedbackBodyFallback: 'Σχόλια: ', analysisComplete: 'Η ανάλυση ολοκληρώθηκε.', analysisUnavailable: 'Η AI του διακομιστή είναι απενεργοποιημένη. Προσθέστε GEMINI_API_KEY (ή ορίστε AI_PROVIDER) στον host του API και δοκιμάστε ξανά.', analysisFailed: 'Η ανάλυση απέτυχε.', apiUnreachable: 'Δεν ήταν δυνατή η πρόσβαση στο {url}. Ελέγξτε τη URL API στο μενού και ότι το backend εκτελείται.', savingToServer: 'Αποθήκευση στον διακομιστή...', savedToServer: 'Αποθηκεύτηκε στον διακομιστή.', saveFailedPrefix: 'Η αποθήκευση απέτυχε: ', loadingFromServer: 'Φόρτωση από τον διακομιστή...', loadedFromServer: 'Φορτώθηκε από τον διακομιστή.', loadFailedPrefix: 'Η φόρτωση απέτυχε: ', noteNotFound: 'Η σημείωση δεν βρέθηκε στον διακομιστή.', noNotesYet: 'Δεν υπάρχουν σημειώσεις ακόμη.', noTitle: '(χωρίς τίτλο)', newNoteUnsaved: 'Νέα σημείωση (δεν έχει αποθηκευτεί ακόμη στον διακομιστή).', loadedFromFile: 'Φορτώθηκε από αρχείο.', dictationEnded: 'Η υπαγόρευση έληξε.', dictationStartFailed: 'Δεν ήταν δυνατή η εκκίνηση υπαγόρευσης. Δοκιμάστε πρώτα να κάνετε κλικ σε πεδίο κειμένου.', callingAnalysisApi: 'Κλήση API ανάλυσης...', callingCoachApi: 'Κλήση API Coach Mode...', coachReady: 'Το Coach Mode είναι έτοιμο.', coachLocal: 'Το Coach Mode άνοιξε με τοπικά κουίζ.', coachUnavailable: 'Το API Coach δεν είναι διαθέσιμο. Άνοιξαν τοπικά κουίζ.', comingSoon: 'Σύντομα!'
    },
    vi: {
        openBeta: 'Beta mở', info: 'Thông tin', openMenu: 'Mở menu', stopDictationTitle: 'Dừng đọc chính tả', dictationStopped: 'Đã dừng đọc chính tả.', dictationUnsupported: 'Trình duyệt này không hỗ trợ đọc chính tả. Hãy thử Chrome hoặc Edge.', dictationSelectTarget: 'Nhấp vào trường văn bản hoặc ô ghi chú trước khi bắt đầu đọc chính tả.', dictationActive: 'Đọc chính tả đang bật. Hãy nói; văn bản nhận dạng sẽ vào trường đã chọn.', forumsUnavailable: 'Liên kết Diễn đàn/Discord chưa được cấu hình trong bản beta này.', feedbackSubject: 'Phản hồi beta TreeNotes', feedbackBodyFallback: 'Phản hồi: ', analysisComplete: 'Phân tích hoàn tất.', analysisUnavailable: 'AI máy chủ đang tắt. Thêm GEMINI_API_KEY (hoặc đặt AI_PROVIDER) trên máy chủ API rồi thử lại.', analysisFailed: 'Phân tích thất bại.', apiUnreachable: 'Không thể kết nối tới {url}. Kiểm tra URL API trong menu và đảm bảo backend đang chạy.', savingToServer: 'Đang lưu lên máy chủ...', savedToServer: 'Đã lưu lên máy chủ.', saveFailedPrefix: 'Lưu thất bại: ', loadingFromServer: 'Đang tải từ máy chủ...', loadedFromServer: 'Đã tải từ máy chủ.', loadFailedPrefix: 'Tải thất bại: ', noteNotFound: 'Không tìm thấy ghi chú trên máy chủ.', noNotesYet: 'Chưa có ghi chú.', noTitle: '(không có tiêu đề)', newNoteUnsaved: 'Ghi chú mới (chưa lưu lên máy chủ).', loadedFromFile: 'Đã tải từ tệp.', dictationEnded: 'Đọc chính tả đã kết thúc.', dictationStartFailed: 'Không thể bắt đầu đọc chính tả. Hãy thử nhấp vào trường văn bản trước.', callingAnalysisApi: 'Đang gọi API phân tích...', callingCoachApi: 'Đang gọi API Coach Mode...', coachReady: 'Coach Mode đã sẵn sàng.', coachLocal: 'Coach Mode đã mở với câu hỏi cục bộ.', coachUnavailable: 'API Coach không khả dụng. Đã mở câu hỏi cục bộ.', comingSoon: 'Sắp có!'
    },
    zh: {
        openBeta: '公开测试版', info: '信息', openMenu: '打开菜单', stopDictationTitle: '停止听写', dictationStopped: '听写已停止。', dictationUnsupported: '此浏览器不支持听写。请尝试 Chrome 或 Edge。', dictationSelectTarget: '开始听写前，请先点击文本字段或笔记单元格。', dictationActive: '听写已开启。现在说话；识别出的文本会进入所选字段。', forumsUnavailable: '此 beta 版本尚未配置论坛/Discord 链接。', feedbackSubject: 'TreeNotes beta 反馈', feedbackBodyFallback: '反馈：', analysisComplete: '分析完成。', analysisUnavailable: '服务器 AI 已关闭。请在 API 主机上添加 GEMINI_API_KEY（或设置 AI_PROVIDER），然后重试。', analysisFailed: '分析失败。', apiUnreachable: '无法访问 {url}。请检查菜单中的 API URL，并确认 backend 正在运行。', savingToServer: '正在保存到服务器...', savedToServer: '已保存到服务器。', saveFailedPrefix: '保存失败：', loadingFromServer: '正在从服务器加载...', loadedFromServer: '已从服务器加载。', loadFailedPrefix: '加载失败：', noteNotFound: '服务器上找不到该笔记。', noNotesYet: '还没有笔记。', noTitle: '（无标题）', newNoteUnsaved: '新笔记（尚未保存到服务器）。', loadedFromFile: '已从文件加载。', dictationEnded: '听写已结束。', dictationStartFailed: '无法开始听写。请先点击文本字段。', callingAnalysisApi: '正在调用分析 API...', callingCoachApi: '正在调用 Coach Mode API...', coachReady: 'Coach Mode 已就绪。', coachLocal: 'Coach Mode 已打开本地练习。', coachUnavailable: 'Coach API 不可用。已打开本地练习。', comingSoon: '即将推出！'
    },
    ja: {
        openBeta: 'オープンベータ', info: '情報', openMenu: 'メニューを開く', stopDictationTitle: '音声入力を停止', dictationStopped: '音声入力を停止しました。', dictationUnsupported: 'このブラウザは音声入力に対応していません。Chrome または Edge をお試しください。', dictationSelectTarget: '音声入力を開始する前に、テキスト欄またはノートセルをクリックしてください。', dictationActive: '音声入力が有効です。話すと、認識されたテキストが選択中の欄に入ります。', forumsUnavailable: 'この beta ビルドではフォーラム/Discord リンクは未設定です。', feedbackSubject: 'TreeNotes beta フィードバック', feedbackBodyFallback: 'フィードバック: ', analysisComplete: '分析が完了しました。', analysisUnavailable: 'サーバー AI がオフです。API ホストに GEMINI_API_KEY を追加するか AI_PROVIDER を設定して、再試行してください。', analysisFailed: '分析に失敗しました。', apiUnreachable: '{url} に接続できません。メニューの API URL と backend の起動状態を確認してください。', savingToServer: 'サーバーに保存中...', savedToServer: 'サーバーに保存しました。', saveFailedPrefix: '保存に失敗しました: ', loadingFromServer: 'サーバーから読み込み中...', loadedFromServer: 'サーバーから読み込みました。', loadFailedPrefix: '読み込みに失敗しました: ', noteNotFound: 'サーバー上にノートが見つかりません。', noNotesYet: 'まだノートがありません。', noTitle: '（無題）', newNoteUnsaved: '新規ノート（まだサーバーに保存されていません）。', loadedFromFile: 'ファイルから読み込みました。', dictationEnded: '音声入力が終了しました。', dictationStartFailed: '音声入力を開始できませんでした。先にテキスト欄をクリックしてください。', callingAnalysisApi: '分析 API を呼び出し中...', callingCoachApi: 'Coach Mode API を呼び出し中...', coachReady: 'Coach Mode の準備ができました。', coachLocal: 'Coach Mode をローカル問題で開きました。', coachUnavailable: 'Coach API を利用できません。ローカル問題を開きました。', comingSoon: '近日公開！'
    },
    ko: {
        openBeta: '오픈 베타', info: '정보', openMenu: '메뉴 열기', stopDictationTitle: '받아쓰기 중지', dictationStopped: '받아쓰기가 중지되었습니다.', dictationUnsupported: '이 브라우저는 받아쓰기를 지원하지 않습니다. Chrome 또는 Edge를 사용해 보세요.', dictationSelectTarget: '받아쓰기를 시작하기 전에 텍스트 필드나 노트 셀을 클릭하세요.', dictationActive: '받아쓰기가 활성화되었습니다. 지금 말하면 인식된 텍스트가 선택한 필드에 입력됩니다.', forumsUnavailable: '이 beta 빌드에는 포럼/Discord 링크가 설정되어 있지 않습니다.', feedbackSubject: 'TreeNotes beta 피드백', feedbackBodyFallback: '피드백: ', analysisComplete: '분석이 완료되었습니다.', analysisUnavailable: '서버 AI가 꺼져 있습니다. API 호스트에 GEMINI_API_KEY를 추가하거나 AI_PROVIDER를 설정한 뒤 다시 시도하세요.', analysisFailed: '분석에 실패했습니다.', apiUnreachable: '{url}에 연결할 수 없습니다. 메뉴의 API URL과 backend 실행 상태를 확인하세요.', savingToServer: '서버에 저장 중...', savedToServer: '서버에 저장되었습니다.', saveFailedPrefix: '저장 실패: ', loadingFromServer: '서버에서 불러오는 중...', loadedFromServer: '서버에서 불러왔습니다.', loadFailedPrefix: '불러오기 실패: ', noteNotFound: '서버에서 노트를 찾을 수 없습니다.', noNotesYet: '아직 노트가 없습니다.', noTitle: '(제목 없음)', newNoteUnsaved: '새 노트입니다(아직 서버에 저장되지 않음).', loadedFromFile: '파일에서 불러왔습니다.', dictationEnded: '받아쓰기가 종료되었습니다.', dictationStartFailed: '받아쓰기를 시작할 수 없습니다. 먼저 텍스트 필드를 클릭해 보세요.', callingAnalysisApi: '분석 API 호출 중...', callingCoachApi: 'Coach Mode API 호출 중...', coachReady: 'Coach Mode가 준비되었습니다.', coachLocal: 'Coach Mode가 로컬 퍼즐로 열렸습니다.', coachUnavailable: 'Coach API를 사용할 수 없습니다. 로컬 퍼즐을 열었습니다.', comingSoon: '곧 제공됩니다!'
    },
    id: {
        openBeta: 'Beta terbuka', info: 'Info', openMenu: 'Buka menu', stopDictationTitle: 'Hentikan dikte', dictationStopped: 'Dikte dihentikan.', dictationUnsupported: 'Dikte tidak didukung di browser ini. Coba Chrome atau Edge.', dictationSelectTarget: 'Klik bidang teks atau sel catatan sebelum memulai dikte.', dictationActive: 'Dikte aktif. Bicara sekarang; teks yang dikenali masuk ke bidang yang dipilih.', forumsUnavailable: 'Tautan Forum/Discord belum dikonfigurasi di build beta ini.', feedbackSubject: 'Masukan beta TreeNotes', feedbackBodyFallback: 'Masukan: ', analysisComplete: 'Analisis selesai.', analysisUnavailable: 'AI server sedang mati. Tambahkan GEMINI_API_KEY (atau atur AI_PROVIDER) di host API, lalu coba lagi.', analysisFailed: 'Analisis gagal.', apiUnreachable: 'Tidak dapat menjangkau {url}. Periksa URL API di menu dan pastikan backend berjalan.', savingToServer: 'Menyimpan ke server...', savedToServer: 'Tersimpan ke server.', saveFailedPrefix: 'Gagal menyimpan: ', loadingFromServer: 'Memuat dari server...', loadedFromServer: 'Dimuat dari server.', loadFailedPrefix: 'Gagal memuat: ', noteNotFound: 'Catatan tidak ditemukan di server.', noNotesYet: 'Belum ada catatan.', noTitle: '(tanpa judul)', newNoteUnsaved: 'Catatan baru (belum disimpan ke server).', loadedFromFile: 'Dimuat dari file.', dictationEnded: 'Dikte berakhir.', dictationStartFailed: 'Dikte tidak dapat dimulai. Coba klik bidang teks terlebih dahulu.', callingAnalysisApi: 'Memanggil API analisis...', callingCoachApi: 'Memanggil API Coach Mode...', coachReady: 'Coach Mode siap.', coachLocal: 'Coach Mode dibuka dengan kuis lokal.', coachUnavailable: 'API Coach tidak tersedia. Kuis lokal dibuka.', comingSoon: 'Segera hadir!'
    },
    ar: {
        openBeta: 'نسخة beta مفتوحة', info: 'معلومات', openMenu: 'فتح القائمة', stopDictationTitle: 'إيقاف الإملاء', dictationStopped: 'تم إيقاف الإملاء.', dictationUnsupported: 'الإملاء غير مدعوم في هذا المتصفح. جرّب Chrome أو Edge.', dictationSelectTarget: 'انقر على حقل نص أو خلية ملاحظة قبل بدء الإملاء.', dictationActive: 'الإملاء نشط. تحدث الآن؛ سيدخل النص المتعرف عليه في الحقل المحدد.', forumsUnavailable: 'رابط المنتديات/Discord غير مكوّن في إصدار beta هذا.', feedbackSubject: 'ملاحظات beta حول TreeNotes', feedbackBodyFallback: 'ملاحظات: ', analysisComplete: 'اكتمل التحليل.', analysisUnavailable: 'ذكاء الخادم الاصطناعي متوقف. أضف GEMINI_API_KEY (أو عيّن AI_PROVIDER) على مضيف API ثم حاول مجددًا.', analysisFailed: 'فشل التحليل.', apiUnreachable: 'تعذر الوصول إلى {url}. تحقق من عنوان API في القائمة ومن أن backend يعمل.', savingToServer: 'جارٍ الحفظ إلى الخادم...', savedToServer: 'تم الحفظ إلى الخادم.', saveFailedPrefix: 'فشل الحفظ: ', loadingFromServer: 'جارٍ التحميل من الخادم...', loadedFromServer: 'تم التحميل من الخادم.', loadFailedPrefix: 'فشل التحميل: ', noteNotFound: 'لم يتم العثور على الملاحظة على الخادم.', noNotesYet: 'لا توجد ملاحظات بعد.', noTitle: '(بلا عنوان)', newNoteUnsaved: 'ملاحظة جديدة (لم تُحفظ على الخادم بعد).', loadedFromFile: 'تم التحميل من ملف.', dictationEnded: 'انتهى الإملاء.', dictationStartFailed: 'تعذر بدء الإملاء. حاول النقر على حقل نص أولًا.', callingAnalysisApi: 'جارٍ استدعاء API التحليل...', callingCoachApi: 'جارٍ استدعاء API وضع Coach...', coachReady: 'وضع Coach جاهز.', coachLocal: 'تم فتح وضع Coach بتمارين محلية.', coachUnavailable: 'API وضع Coach غير متاح. تم فتح تمارين محلية.', comingSoon: 'قريبًا!'
    },
    fa: {
        openBeta: 'بتای عمومی', info: 'اطلاعات', openMenu: 'باز کردن منو', stopDictationTitle: 'توقف گفتار به متن', dictationStopped: 'گفتار به متن متوقف شد.', dictationUnsupported: 'این مرورگر از گفتار به متن پشتیبانی نمی‌کند. Chrome یا Edge را امتحان کنید.', dictationSelectTarget: 'پیش از شروع گفتار به متن، روی یک فیلد متن یا سلول یادداشت کلیک کنید.', dictationActive: 'گفتار به متن فعال است. اکنون صحبت کنید؛ متن تشخیص‌داده‌شده در فیلد انتخاب‌شده وارد می‌شود.', forumsUnavailable: 'پیوند انجمن‌ها/Discord در این نسخه beta پیکربندی نشده است.', feedbackSubject: 'بازخورد beta TreeNotes', feedbackBodyFallback: 'بازخورد: ', analysisComplete: 'تحلیل کامل شد.', analysisUnavailable: 'هوش مصنوعی سرور خاموش است. GEMINI_API_KEY را اضافه کنید (یا AI_PROVIDER را تنظیم کنید) و دوباره تلاش کنید.', analysisFailed: 'تحلیل ناموفق بود.', apiUnreachable: 'دسترسی به {url} ممکن نیست. نشانی API را در منو بررسی کنید و مطمئن شوید backend در حال اجراست.', savingToServer: 'در حال ذخیره در سرور...', savedToServer: 'در سرور ذخیره شد.', saveFailedPrefix: 'ذخیره ناموفق بود: ', loadingFromServer: 'در حال بارگیری از سرور...', loadedFromServer: 'از سرور بارگیری شد.', loadFailedPrefix: 'بارگیری ناموفق بود: ', noteNotFound: 'یادداشت روی سرور پیدا نشد.', noNotesYet: 'هنوز یادداشتی وجود ندارد.', noTitle: '(بدون عنوان)', newNoteUnsaved: 'یادداشت جدید (هنوز در سرور ذخیره نشده است).', loadedFromFile: 'از فایل بارگیری شد.', dictationEnded: 'گفتار به متن پایان یافت.', dictationStartFailed: 'گفتار به متن شروع نشد. ابتدا روی یک فیلد متن کلیک کنید.', callingAnalysisApi: 'در حال فراخوانی API تحلیل...', callingCoachApi: 'در حال فراخوانی API حالت Coach...', coachReady: 'حالت Coach آماده است.', coachLocal: 'حالت Coach با آزمون‌های محلی باز شد.', coachUnavailable: 'API حالت Coach در دسترس نیست. آزمون‌های محلی باز شدند.', comingSoon: 'به‌زودی!'
    },
    he: {
        openBeta: 'בטא פתוחה', info: 'מידע', openMenu: 'פתח תפריט', stopDictationTitle: 'עצור הכתבה', dictationStopped: 'ההכתבה נעצרה.', dictationUnsupported: 'הכתבה אינה נתמכת בדפדפן זה. נסה Chrome או Edge.', dictationSelectTarget: 'לחץ על שדה טקסט או תא הערה לפני התחלת ההכתבה.', dictationActive: 'ההכתבה פעילה. דבר עכשיו; הטקסט המזוהה ייכנס לשדה שנבחר.', forumsUnavailable: 'קישור פורומים/Discord אינו מוגדר בגרסת beta זו.', feedbackSubject: 'משוב beta על TreeNotes', feedbackBodyFallback: 'משוב: ', analysisComplete: 'הניתוח הושלם.', analysisUnavailable: 'AI השרת כבוי. הוסף GEMINI_API_KEY (או הגדר AI_PROVIDER) במארח ה-API ונסה שוב.', analysisFailed: 'הניתוח נכשל.', apiUnreachable: 'לא ניתן להגיע אל {url}. בדוק את כתובת ה-API בתפריט ושה-backend פועל.', savingToServer: 'שומר לשרת...', savedToServer: 'נשמר לשרת.', saveFailedPrefix: 'השמירה נכשלה: ', loadingFromServer: 'טוען מהשרת...', loadedFromServer: 'נטען מהשרת.', loadFailedPrefix: 'הטעינה נכשלה: ', noteNotFound: 'ההערה לא נמצאה בשרת.', noNotesYet: 'אין הערות עדיין.', noTitle: '(ללא כותרת)', newNoteUnsaved: 'הערה חדשה (עדיין לא נשמרה לשרת).', loadedFromFile: 'נטען מקובץ.', dictationEnded: 'ההכתבה הסתיימה.', dictationStartFailed: 'לא ניתן להתחיל הכתבה. נסה ללחוץ קודם על שדה טקסט.', callingAnalysisApi: 'קורא ל-API הניתוח...', callingCoachApi: 'קורא ל-API של Coach Mode...', coachReady: 'Coach Mode מוכן.', coachLocal: 'Coach Mode נפתח עם תרגילים מקומיים.', coachUnavailable: 'API של Coach אינו זמין. נפתחו תרגילים מקומיים.', comingSoon: 'בקרוב!'
    },
    yi: {
        openBeta: 'אָפענע beta', info: 'אינפֿאָ', openMenu: 'עפֿענען מעניו', stopDictationTitle: 'אָפּשטעלן דיקטאַציע', dictationStopped: 'דיקטאַציע איז אָפּגעשטעלט.', dictationUnsupported: 'דיקטאַציע ווערט נישט געשטיצט אין דעם בלעטערער. פּרוּווט Chrome אָדער Edge.', dictationSelectTarget: 'קוועטשן אַ טעקסט־פֿעלד אָדער נאָטיץ־צעל איידער איר הייבט אָן דיקטאַציע.', dictationActive: 'דיקטאַציע איז אַקטיוו. רעדט איצט; דער דערקענטער טעקסט גייט אין אויסגעקליבענעם פֿעלד.', forumsUnavailable: 'דער פֿאָרומען/Discord לינק איז נישט קאָנפֿיגורירט אין דער beta ווערסיע.', feedbackSubject: 'TreeNotes beta באַמערקונגען', feedbackBodyFallback: 'באַמערקונג: ', analysisComplete: 'אַנאַליז איז פֿאַרטיק.', analysisUnavailable: 'סערווער AI איז אויס. לייגט צו GEMINI_API_KEY (אָדער שטעלט AI_PROVIDER) אויפֿן API host און פּרוּווט ווידער.', analysisFailed: 'אַנאַליז איז דורכגעפֿאַלן.', apiUnreachable: 'מען קען נישט דערגרייכן {url}. קאָנטראָלירט די API URL אין מעניו און אַז backend לויפֿט.', savingToServer: 'אויפֿהיטן אויפֿן סערווער...', savedToServer: 'אויפֿגעהיט אויפֿן סערווער.', saveFailedPrefix: 'אויפֿהיטן איז דורכגעפֿאַלן: ', loadingFromServer: 'לאָדן פֿונעם סערווער...', loadedFromServer: 'געלאָדן פֿונעם סערווער.', loadFailedPrefix: 'לאָדן איז דורכגעפֿאַלן: ', noteNotFound: 'נאָטיץ נישט געפֿונען אויפֿן סערווער.', noNotesYet: 'נאָך קיין נאָטיצן נישטאָ.', noTitle: '(אָן קעפּל)', newNoteUnsaved: 'נײַע נאָטיץ (נאָך נישט אויפֿגעהיט אויפֿן סערווער).', loadedFromFile: 'געלאָדן פֿון טעקע.', dictationEnded: 'דיקטאַציע האָט זיך געענדיקט.', dictationStartFailed: 'דיקטאַציע קען נישט אָנהייבן. פּרוּווט קודם קוועטשן אַ טעקסט־פֿעלד.', callingAnalysisApi: 'רופֿן אַנאַליז API...', callingCoachApi: 'רופֿן Coach Mode API...', coachReady: 'Coach Mode איז גרייט.', coachLocal: 'Coach Mode האָט געעפֿנט לאָקאַלע קוויזן.', coachUnavailable: 'Coach API איז נישט בנימצא. לאָקאַלע קוויזן זענען געעפֿנט.', comingSoon: 'קומט באַלד!'
    }
};
for (const [language, labels] of Object.entries(UI_STATUS_TRANSLATIONS)) {
    Object.assign(UI_TRANSLATIONS[language], labels);
}
const UI_POLISH_TRANSLATIONS = {
    en: {
        browserDefault: 'Browser default',
        headingColorSettings: 'Heading color settings',
        backgroundColor: 'Background',
        connectionChecking: 'Checking',
        connectionOnline: 'Online',
        connectionLimited: 'Limited connection',
        connectionOffline: 'Offline/local',
        checkConnectionTitle: 'Check connection status'
    },
    fr: {
        browserDefault: 'Par défaut du navigateur',
        headingColorSettings: "Couleurs de l'en-tête",
        backgroundColor: 'Arrière-plan',
        connectionChecking: 'Vérification',
        connectionOnline: 'En ligne',
        connectionLimited: 'Connexion limitée',
        connectionOffline: 'Hors ligne/local',
        checkConnectionTitle: 'Vérifier la connexion'
    },
    de: {
        browserDefault: 'Browser-Standard',
        headingColorSettings: 'Farben der Überschrift',
        backgroundColor: 'Hintergrund',
        connectionChecking: 'Prüfung',
        connectionOnline: 'Online',
        connectionLimited: 'Eingeschränkte Verbindung',
        connectionOffline: 'Offline/lokal',
        checkConnectionTitle: 'Verbindungsstatus prüfen'
    },
    es: {
        browserDefault: 'Predeterminado del navegador',
        headingColorSettings: 'Colores del encabezado',
        backgroundColor: 'Fondo',
        connectionChecking: 'Comprobando',
        connectionOnline: 'En línea',
        connectionLimited: 'Conexión limitada',
        connectionOffline: 'Sin conexión/local',
        checkConnectionTitle: 'Comprobar conexión'
    },
    it: {
        browserDefault: 'Predefinito del browser',
        headingColorSettings: 'Colori intestazione',
        backgroundColor: 'Sfondo',
        connectionChecking: 'Verifica',
        connectionOnline: 'Online',
        connectionLimited: 'Connessione limitata',
        connectionOffline: 'Offline/locale',
        checkConnectionTitle: 'Controlla connessione'
    },
    pt: {
        browserDefault: 'Padrão do navegador',
        headingColorSettings: 'Cores do cabeçalho',
        backgroundColor: 'Fundo',
        connectionChecking: 'Verificando',
        connectionOnline: 'Online',
        connectionLimited: 'Conexão limitada',
        connectionOffline: 'Offline/local',
        checkConnectionTitle: 'Verificar conexão'
    },
    ru: {
        browserDefault: 'По умолчанию браузера',
        headingColorSettings: 'Цвета заголовка',
        backgroundColor: 'Фон',
        connectionChecking: 'Проверка',
        connectionOnline: 'Онлайн',
        connectionLimited: 'Ограниченное подключение',
        connectionOffline: 'Офлайн/локально',
        checkConnectionTitle: 'Проверить подключение'
    },
    el: {
        browserDefault: 'Προεπιλογή προγράμματος περιήγησης',
        headingColorSettings: 'Χρώματα κεφαλίδας',
        backgroundColor: 'Φόντο',
        connectionChecking: 'Έλεγχος',
        connectionOnline: 'Σε σύνδεση',
        connectionLimited: 'Περιορισμένη σύνδεση',
        connectionOffline: 'Εκτός σύνδεσης/τοπικά',
        checkConnectionTitle: 'Έλεγχος σύνδεσης'
    },
    vi: {
        browserDefault: 'Mặc định trình duyệt',
        headingColorSettings: 'Màu tiêu đề',
        backgroundColor: 'Nền',
        connectionChecking: 'Đang kiểm tra',
        connectionOnline: 'Trực tuyến',
        connectionLimited: 'Kết nối hạn chế',
        connectionOffline: 'Ngoại tuyến/cục bộ',
        checkConnectionTitle: 'Kiểm tra kết nối'
    },
    zh: {
        browserDefault: '浏览器默认',
        headingColorSettings: '标题颜色设置',
        backgroundColor: '背景',
        connectionChecking: '检查中',
        connectionOnline: '在线',
        connectionLimited: '连接受限',
        connectionOffline: '离线/本地',
        checkConnectionTitle: '检查连接状态'
    },
    ja: {
        browserDefault: 'ブラウザ既定',
        headingColorSettings: '見出しの色設定',
        backgroundColor: '背景',
        connectionChecking: '確認中',
        connectionOnline: 'オンライン',
        connectionLimited: '制限付き接続',
        connectionOffline: 'オフライン/ローカル',
        checkConnectionTitle: '接続状態を確認'
    },
    ko: {
        browserDefault: '브라우저 기본값',
        headingColorSettings: '제목 색상 설정',
        backgroundColor: '배경',
        connectionChecking: '확인 중',
        connectionOnline: '온라인',
        connectionLimited: '제한된 연결',
        connectionOffline: '오프라인/로컬',
        checkConnectionTitle: '연결 상태 확인'
    },
    id: {
        browserDefault: 'Default browser',
        headingColorSettings: 'Warna judul',
        backgroundColor: 'Latar',
        connectionChecking: 'Memeriksa',
        connectionOnline: 'Online',
        connectionLimited: 'Koneksi terbatas',
        connectionOffline: 'Offline/lokal',
        checkConnectionTitle: 'Periksa koneksi'
    },
    ar: {
        browserDefault: 'افتراضي المتصفح',
        headingColorSettings: 'ألوان العنوان',
        backgroundColor: 'الخلفية',
        connectionChecking: 'جارٍ الفحص',
        connectionOnline: 'متصل',
        connectionLimited: 'اتصال محدود',
        connectionOffline: 'غير متصل/محلي',
        checkConnectionTitle: 'فحص حالة الاتصال'
    },
    fa: {
        browserDefault: 'پیش‌فرض مرورگر',
        headingColorSettings: 'رنگ‌های سربرگ',
        backgroundColor: 'پس‌زمینه',
        connectionChecking: 'در حال بررسی',
        connectionOnline: 'آنلاین',
        connectionLimited: 'اتصال محدود',
        connectionOffline: 'آفلاین/محلی',
        checkConnectionTitle: 'بررسی وضعیت اتصال'
    },
    he: {
        browserDefault: 'ברירת מחדל של הדפדפן',
        headingColorSettings: 'צבעי כותרת',
        backgroundColor: 'רקע',
        connectionChecking: 'בודק',
        connectionOnline: 'מקוון',
        connectionLimited: 'חיבור מוגבל',
        connectionOffline: 'לא מקוון/מקומי',
        checkConnectionTitle: 'בדוק מצב חיבור'
    },
    yi: {
        browserDefault: 'בלעטערער נאָרמאַל',
        headingColorSettings: 'קעפּל־קאָלירן',
        backgroundColor: 'הינטערגרונט',
        connectionChecking: 'קאָנטראָלירן',
        connectionOnline: 'אָנליין',
        connectionLimited: 'באַגרענעצטע פֿאַרבינדונג',
        connectionOffline: 'אָפֿליין/לאָקאַל',
        checkConnectionTitle: 'קאָנטראָלירן פֿאַרבינדונג'
    }
};
for (const [language, labels] of Object.entries(UI_POLISH_TRANSLATIONS)) {
    Object.assign(UI_TRANSLATIONS[language], labels);
}

// Get the first DOM element with the class "box". This is likely the initial box.
const seed = document.querySelectorAll(".box")[0];
ensureBoxFooter(seed);

// --------------------------------------------------------------------------
// Event Listeners Attached on Initialization
// --------------------------------------------------------------------------

// Attach a listener to the seed box to handle pasting images directly into it.
listenForImagePaste(seed);

// Make the initial seed box draggable using the makeDraggable function.
makeDraggable(seed);

// Attach event listeners to the buttons within the box toolbar.
boxToolbarListeners();

// --------------------------------------------------------------------------
// Initialization of the 'boxes' Map with the Seed Box
// --------------------------------------------------------------------------

// Add the seed box to the 'boxes' Map. The key is the box's ID,
// and the value is an object containing the box element itself and an empty
// Map to store the IDs of the lines connected to this box.
boxes.set(seed.id, {
    box: seed,
    lines: []
});
setupBoxPlaceholder(seed);

// --------------------------------------------------------------------------
// Zoom Functionality
// --------------------------------------------------------------------------

/**
 * Zooms the canvas in or out by multiplying the current scale.
 * @param {number} times - The factor by which to zoom (e.g., 2 for 2x zoom, 0.5 for 0.5x zoom).
 */
function zoom(times) {
    const canvas = document.getElementById("zoom");
    if (!canvas) return;

    const transform = canvas.style.transform || "matrix(1, 0, 0, 1, 0, 0)";
    const matrix = new DOMMatrix(transform);
    const scale = matrix.a || 1;

    canvas.style.transform = `scale(${scale * times})`;
}

// --------------------------------------------------------------------------
// Drag and Drop Functionality for Boxes
// --------------------------------------------------------------------------

/**
 * Makes a given HTML element draggable.
 * Uses closures to maintain event listener variables without global scope.
 * @param {HTMLElement} box - The HTML element to make draggable.
 */
function makeDraggable(box) {
    let isDragging = false;
    let offsetX, offsetY;

    // Update the SVG link endpoints whenever the box loses focus — its height
    // may have changed because the user just typed into it. We deliberately
    // do NOT collapse the height here (the previous "height = 7px" on blur
    // hid most of the content and made boxes look broken).
    box.addEventListener("blur", () => {
        updateLinesPosition(box);
    });

    // Event listener for when the box is clicked.
    // Shows the toolbar associated with the clicked box.
    box.addEventListener("click", () => {
        const toolbar = document.getElementById('toolbar');
        const rect = box.getBoundingClientRect();
        const colorPicker = document.getElementById("boxColor");
        const textColorPicker = document.getElementById("boxTextColor");
        const computedStyle = getComputedStyle(box);
        colorPicker.value = colorToHex(box.style.backgroundColor || computedStyle.backgroundColor);
        textColorPicker.value = colorToHex(box.style.color || computedStyle.color);
        toolbar.style.visibility = 'hidden';
        toolbar.style.display = 'flex';
        const left = Math.min(window.innerWidth - toolbar.offsetWidth - 8, rect.right + 8);
        toolbar.style.left = `${Math.max(8, left)}px`;
        toolbar.style.top = `${Math.max(8, rect.top)}px`;
        toolbar.style.visibility = '';
        document.getElementById("toolbar").dataset.boxId = box.id;
    });

    box.addEventListener("input", () => {
        syncBoxPlaceholderState(box);
        updateLinesPosition(box);
    });

    // Event listener for when the mouse button is pressed down on the box.
    // Initiates the dragging process.
    box.addEventListener("mousedown", (e) => {
        if (e.target.closest('#toolbar')) return;
        isDragging = true;
        offsetX = e.clientX - box.offsetLeft;
        offsetY = e.clientY - box.offsetTop;
        box.style.cursor = "grabbing";
    });

    // Event listener for mouse movement across the window.
    // Handles the actual dragging of the box and updates line positions.
    window.addEventListener("mousemove", (e) => {
        const container = document.getElementById("tree");
        const limitReached = container.offsetLeft > e.clientX || container.offsetTop > e.clientY;
        if (!isDragging || limitReached) return;
        box.style.left = e.clientX - offsetX + "px";
        box.style.top = e.clientY - offsetY + "px";
        updateLinesPosition(box);
    });

    // Event listener for when the mouse button is released over the window.
    // Ends the dragging process.
    window.addEventListener("mouseup", () => {
        isDragging = false;
        box.style.cursor = "grab";
    });
}

// --------------------------------------------------------------------------
// Box Creation and Management
// --------------------------------------------------------------------------

function addBlock(box) {
    const [x1, y1] = getBoxCoords(box);
    const newBox = createNewBlock(x1, y1);
    newLine(box, newBox);
}

/**
 * Creates a new draggable block (div element) and appends it to the "boxes" container.
 * @param {number} [x=0] - The initial x-coordinate (left position) of the new box.
 * @param {number} [y=20] - The initial y-coordinate (top position) of the new box.
 * @param {string} [content="New Box"] - The placeholder or initial text content of the new box.
 * @param {{id?: string|number, contentIsPlaceholder?: boolean, placeholder?: string}} [options={}] - Optional metadata.
 * @returns {HTMLElement} The newly created box element.
 */
function createNewBlock(x = 0, y = 20, content = "New Box", options = {}) {
    const { id: requestedId = null, contentIsPlaceholder = true, placeholder = "Seed" } = options;
    const newBox = document.createElement('div');
    const resolvedId = requestedId !== null ? String(requestedId) : String(++totalBoxes);

    totalBoxes = Math.max(totalBoxes, Number(resolvedId));

    newBox.id = resolvedId;
    newBox.className = "box";
    newBox.style.position = "absolute";
    newBox.style.left = `${x}px`;
    newBox.style.top = `${y}px`;
    newBox.contentEditable = true;
    newBox.dataset.placeholder = contentIsPlaceholder ? (content || placeholder) : placeholder;
    newBox.textContent = contentIsPlaceholder ? "" : (content || "");
    syncBoxPlaceholderState(newBox);

    ensureBoxFooter(newBox);

    document.getElementById("boxes").appendChild(newBox);
    makeDraggable(newBox);
    listenForImagePaste(newBox);
    setupBoxPlaceholder(newBox);

    boxes.set(newBox.id, {
        box: newBox,
        lines: []
    });

    return newBox;
}

function getBoxText(box) {
    if (!box) return "";
    const clone = box.cloneNode(true);
    clone.querySelector('.boxFooter')?.remove();
    return clone.textContent.trim();
}

function syncBoxPlaceholderState(box) {
    if (!box) return;
    box.classList.toggle('is-empty', getBoxText(box).length === 0);
}

function setupBoxPlaceholder(box) {
    if (!box) return;
    syncBoxPlaceholderState(box);
    box.addEventListener('focus', () => syncBoxPlaceholderState(box));
    box.addEventListener('blur', () => syncBoxPlaceholderState(box));
}

function ensureBoxFooter(box) {
    if (!box) return;
    box.dataset.label = `#${box.id}`;
    box.querySelector('.boxFooter')?.remove();
}

function applyBoxCustomColor(box, color) {
    if (!box) return;
    const hex = colorToHex(color);
    box.style.backgroundColor = hex;
    if (!box.classList.contains('has-custom-text-color')) {
        box.style.color = readableTextColor(hex);
    }
    box.classList.add('has-custom-color');
}

function applyBoxTextColor(box, color) {
    if (!box) return;
    box.style.color = colorToHex(color);
    box.classList.add('has-custom-text-color');
}

function applyHeadingColor(color) {
    const heading = document.getElementById("heading");
    if (!heading) return;
    heading.style.background = colorToHex(color);
    heading.dataset.customBackground = "true";
}

function applyHeadingTextColor(color) {
    const heading = document.getElementById("heading");
    const headingText = document.getElementById("headingText");
    if (!heading || !headingText) return;
    const hex = colorToHex(color);
    heading.style.color = hex;
    headingText.style.color = hex;
    heading.dataset.customText = "true";
}

function resetHeadingStyle() {
    const heading = document.getElementById("heading");
    const headingText = document.getElementById("headingText");
    if (!heading || !headingText) return;
    heading.style.background = "";
    heading.style.color = "";
    headingText.style.color = "";
    delete heading.dataset.customBackground;
    delete heading.dataset.customText;
    const headingColor = document.getElementById("headingColor");
    const headingTextColor = document.getElementById("headingTextColor");
    if (headingColor) headingColor.value = "#22C55E";
    if (headingTextColor) headingTextColor.value = "#FFFFFF";
}

function getHeadingStylePayload() {
    const heading = document.getElementById("heading");
    const headingText = document.getElementById("headingText");
    return {
        backgroundColor: heading?.dataset.customBackground ? colorToHex(heading.style.backgroundColor || heading.style.background) : null,
        color: heading?.dataset.customText ? colorToHex(headingText?.style.color || heading?.style.color || "") : null
    };
}

function applyHeadingStylePayload(style = {}) {
    resetHeadingStyle();
    if (style?.backgroundColor) applyHeadingColor(style.backgroundColor);
    if (style?.color) applyHeadingTextColor(style.color);
}

function initHeadingColorControls() {
    const headingColor = document.getElementById("headingColor");
    const headingTextColor = document.getElementById("headingTextColor");
    const controls = document.querySelector(".heading-color-controls");
    const toggle = document.getElementById("headingColorMenuToggle");
    if (!headingColor || !headingTextColor) return;

    headingColor.addEventListener("input", event => applyHeadingColor(event.target.value));
    headingColor.addEventListener("change", event => applyHeadingColor(event.target.value));
    headingTextColor.addEventListener("input", event => applyHeadingTextColor(event.target.value));
    headingTextColor.addEventListener("change", event => applyHeadingTextColor(event.target.value));

    if (!controls || !toggle) return;

    const closeMenu = () => {
        controls.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    };
    const openMenu = () => {
        controls.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", event => {
        event.stopPropagation();
        controls.classList.contains("is-open") ? closeMenu() : openMenu();
    });

    controls.addEventListener("click", event => {
        event.stopPropagation();
    });

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });
}

// --------------------------------------------------------------------------
// Box Lifecycle Helpers
// --------------------------------------------------------------------------

/**
 * Deletes a specified box and all the lines connected to it.
 * @param {HTMLElement} box - The box element to be deleted.
 */
function deleteBox(box) {
    const lines = getLinesAttached(box);
    lines.forEach(line => {
        deleteLine(line);
    });
    box.remove();
    boxes.delete(box.id);
}

function duplicateBox(box) {
    if (!box) return null;
    const [left, top] = getBoxCoords(box);
    const duplicate = createNewBlock(left + 28, top + 28, getBoxText(box), { contentIsPlaceholder: false });

    if (box.classList.contains('has-custom-color')) {
        applyBoxCustomColor(duplicate, box.style.backgroundColor);
    }

    if (box.classList.contains('has-custom-text-color')) {
        applyBoxTextColor(duplicate, box.style.color);
    }

    duplicate.style.width = box.style.width;
    duplicate.style.height = box.style.height;
    syncBoxPlaceholderState(duplicate);
    return duplicate;
}

// --------------------------------------------------------------------------
// Line Creation and Management
// --------------------------------------------------------------------------

/**
 * Creates a new SVG line element connecting two specified boxes.
 * @param {HTMLElement|string} box1 - The first box element or its ID.
 * @param {HTMLElement|string} box2 - The second box element or its ID.
 */
function newLine(box1, box2) {
    const firstBox = typeof box1 === "string" ? document.getElementById(box1) : box1;
    const secondBox = typeof box2 === "string" ? document.getElementById(box2) : box2;

    if (!firstBox || !secondBox) return;

    const sortedIds = [firstBox.id, secondBox.id].sort((a, b) => Number(a) - Number(b));
    const lineId = sortedIds.join("_");

    if (document.getElementById(lineId)) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", lineId);
    line.setAttribute("class", "line");

    const firstEntry = boxes.get(firstBox.id);
    const secondEntry = boxes.get(secondBox.id);

    if (firstEntry && !firstEntry.lines.includes(secondBox.id)) {
        firstEntry.lines.push(secondBox.id);
    }

    if (secondEntry && !secondEntry.lines.includes(firstBox.id)) {
        secondEntry.lines.push(firstBox.id);
    }

    const [x1, y1] = getBoxCoords(firstBox);
    const [x2, y2] = getBoxCoords(secondBox);
    updateLinePosition(line, x1, y1, x2, y2);
    document.getElementById("lines").appendChild(line);
}

/**
 * Updates the position of all lines connected to a given box.
 * @param {HTMLElement} box - The box whose connected lines need to be updated.
 */
function updateLinesPosition(box) {
    for (const line of document.querySelectorAll(".line")) {
        const [startId, endId] = line.id.split("_");
        if (box.id === startId) {
            const [x1, y1] = getBoxCoords(box);
            updateLinePosition(line, x1, y1, false, false);
        } else if (box.id === endId) {
            const [x2, y2] = getBoxCoords(box);
            updateLinePosition(line, false, false, x2, y2);
        }
    }
}

/**
 * Deletes a specified SVG line element and updates the 'boxes' Map accordingly.
 * @param {SVGLineElement} line - The SVG line element to be deleted.
 */
function deleteLine(line) {
    const [a, b] = line.id.split("_");
    const firstEntry = boxes.get(a);
    const secondEntry = boxes.get(b);

    if (firstEntry) {
        firstEntry.lines = firstEntry.lines.filter(id => id !== b);
    }
    if (secondEntry) {
        secondEntry.lines = secondEntry.lines.filter(id => id !== a);
    }

    line.remove();
}

/**
 * Retrieves all SVG line elements that are connected to a given box.
 * @param {HTMLElement} box - The box element to find connected lines for.
 * @returns {SVGLineElement[]} An array of SVG line elements connected to the box.
 */
function getLinesAttached(box) {
    return Array.from(document.querySelectorAll(".line")).filter(line => {
        const [a, b] = line.id.split("_");
        return a === box.id || b === box.id;
    });
}

/**
 * Gets the center coordinates (x, y) of a given HTML element.
 * @param {HTMLElement} box - The HTML element.
 * @returns {number[]} An array containing the x and y coordinates of the center of the box.
 */
function getBoxCoords(box) {
    const x = box.offsetLeft + box.offsetWidth / 2;
    const y = box.offsetTop + box.offsetHeight / 2;
    return [x, y];
}

/**
 * Updates the coordinates of an SVG line element.
 * @param {SVGLineElement} line - The SVG line element to update.
 * @param {number|boolean} [x1=false] - The new x1 coordinate, or false to not update.
 * @param {number|boolean} [y1=false] - The new y1 coordinate, or false to not update.
 * @param {number|boolean} [x2=false] - The new x2 coordinate, or false to not update.
 * @param {number|boolean} [y2=false] - The new y2 coordinate, or false to not update.
 */
function updateLinePosition(line, x1 = false, y1 = false, x2 = false, y2 = false) {
    if (x1 !== false) line.setAttribute("x1", x1);
    if (y1 !== false) line.setAttribute("y1", y1);
    if (x2 !== false) line.setAttribute("x2", x2);
    if (y2 !== false) line.setAttribute("y2", y2);
}


// --------------------------------------------------------------------------
// Plain Text Pasting
// --------------------------------------------------------------------------

function insertPlainTextAtSelection(text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    selection.removeAllRanges();
    selection.addRange(range);
}

function insertTextIntoEditable(editable, text) {
    if (!editable || !text) return;
    editable.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    const prefix = editable.textContent.trim() ? ' ' : '';
    insertPlainTextAtSelection(prefix + text);
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    if (editable.classList?.contains('box')) updateLinesPosition(editable);
}

function rememberDictationTarget(event) {
    const editable = event.target.closest?.('[contenteditable="true"]');
    if (editable) dictationTarget = editable;
}

function getDictationTarget() {
    const activeEditable = document.activeElement?.closest?.('[contenteditable="true"]');
    if (activeEditable) {
        dictationTarget = activeEditable;
        return activeEditable;
    }
    if (dictationTarget?.isConnected) return dictationTarget;
    const firstEmptyBox = document.querySelector('#boxes .box');
    dictationTarget = firstEmptyBox || document.getElementById('notesText') || document.getElementById('cueText');
    return dictationTarget;
}

function listenForImagePaste(box) {
    box.addEventListener('paste', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const text = event.clipboardData?.getData('text/plain') || '';
        insertPlainTextAtSelection(text);
        box.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    });
}

function setupPlainTextPaste() {
    document.addEventListener('paste', event => {
        const editable = event.target.closest?.('[contenteditable="true"]');
        if (!editable) return;
        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') || '';
        insertPlainTextAtSelection(text);
        editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    });
}

function setupDictationTargetTracking() {
    document.addEventListener('focusin', rememberDictationTarget);
    document.addEventListener('click', rememberDictationTarget);
}

// --------------------------------------------------------------------------
// Custom Text Context Menu and Highlighting
// --------------------------------------------------------------------------

/**
 * Checks if the current text selection is within a <span> element inside the "#text" container.
 * @param {Selection} selection - The current window text selection.
 * @returns {HTMLElement|boolean} The <span> element if selected text is within one, otherwise false.
 */
function isSpan(selection) {
    const range = selection.getRangeAt(0);
    let commonAncestor = range.commonAncestorContainer;
    if (commonAncestor.nodeType === Node.TEXT_NODE) {
        commonAncestor = commonAncestor.parentElement;
    }
    if (!commonAncestor.closest('#text')) return false;
    if (commonAncestor.tagName === "SPAN") {
        return commonAncestor;
    }
    return false;
}

/**
 * Highlights the selected text by wrapping it in a span with the given background color.
 * If the selected text is already within a span, it updates the background color.
 * @param {string} color - The background color to apply to the highlighted text.
 * @param {HTMLElement|boolean} isSpan - The existing span element if the text is already highlighted, or false otherwise.
 * @returns {HTMLElement|boolean} The created or updated span element, or false if an error occurred.
 */
function highlightText(color, isSpan) {
    if (isSpan) {
        isSpan.style.backgroundColor = color;
        addGlow(isSpan, color);
    } else {
        const span = document.createElement("span");
        span.className = "highlight";
        span.style.backgroundColor = color;
        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.surroundContents(span);
            addGlow(span, color);
            return span;
        } catch (error) {
            console.warn("Erros Highlighting", error);
            return false;
        }
    }
}

/**
 * Removes a span element, effectively removing the highlight or link.
 * @param {HTMLElement} span - The span element to remove.
 */
function removeSpan(span) {
    const content = span.textContent;
    const textNode = document.createTextNode(content);
    span.replaceWith(textNode);
}

/**
 * Updates the options in the link dropdown within the text toolbar.
 * @param {string} link - The ID of the box that should be marked as selected, if any.
 */
function updateBoxList(link) {
    const dropdown = document.getElementById("t_dropdown");
    const boxes = document.getElementById("boxes").children;
    dropdown.innerHTML = `<option value='none' ${link ? "" : "selected"}>--None--</option>`;
    Array(...boxes).forEach(box => {
        const option = document.createElement("option");
        option.value = box.id;
        option.selected = link == box.id ? "selected" : "";
        option.innerHTML = "Box# " + box.id;
        dropdown.appendChild(option);

        // Add glow effect on mouseenter/mouseleave for dropdown options
        option.addEventListener("mouseenter", e => glowBox(e));
        option.addEventListener("mouseleave", e => noGlowBox(e));

        function glowBox(e) {
            const id = e.target.value;
            document.documentElement.style.setProperty("--glow-color", "black");
            document.getElementById(id)?.classList.add("glow");
        }

        function noGlowBox(e) {
            const id = e.target.value;
            document.getElementById(id)?.classList.remove("glow");
        }
    });
}

/**
 * Extracts the box ID from a string that represents setting the window location hash.
 * @param {string} e - The string containing the window.location.href assignment.
 * @returns {string|boolean} The extracted box ID, or false if no ID is found.
 */
function getLink(e) {
    let match = e.match(/window\.location\.href\s*=\s*['"]#(.*?)['"]/);
    if (match) {
        match = match[1];
        console.log("ID:", match);
        return match;
    }
    return false;
}

/**
 * Event listener for the "text" element's context menu (right-click).
 * Prevents the default context menu and displays a custom text toolbar.
 */
document.getElementById("text").addEventListener("contextmenu", (e) => {
    e.preventDefault();

    // To remove all event listeners on the toolbar (for updating them)
    const loadToolbar = document.getElementById("textToolbar");
    loadToolbar.parentNode.replaceChild(loadToolbar.cloneNode(true), loadToolbar);

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    let span = isSpan(selection);

    // Event listener for the text highlight color picker
    document.getElementById("t_boxColor").addEventListener("change", e => {
        const color = colorToHex(e.target.value);
        highlightText(color, span);
    });

    // Event listener for the link dropdown
    document.getElementById("t_dropdown").addEventListener("change", e => {
        if (!span) {
            span = highlightText("#FFFF00", false);
            document.getElementById("t_boxColor").value = "#FFFF00";
        }
        span.dataset.boxId = e.target.value;
        span.setAttribute("onclick", `window.location.href='#${e.target.value}'`);
    });

    // Event listener for removing the text highlight/link
    document.getElementById("t_remove").addEventListener("click", e => {
        if (span) {
            removeSpan(span);
            removetoolbar();
        }
    });

    // Update the color picker value and visibility of the remove button
    document.getElementById("t_boxColor").value = span ? colorToHex(span.style.backgroundColor) : "#ffffff";
    document.getElementById("t_remove").style.display = span ? "inline" : "none";
    updateBoxList(span.dataset?.boxId);

    const toolbar = document.getElementById("textToolbar");
    toolbar.style.left = e.clientX + 'px';
    toolbar.style.top = e.clientY + 'px';

    toolbar.style.display = 'block'; // Show the toolbar

    // Function to hide the text toolbar and clear selection
    function removetoolbar() {
        selection?.removeAllRanges();
        toolbar.style.display = 'none';
    }
});

// --------------------------------------------------------------------------
// Toolbar Visibility Management (General)
// --------------------------------------------------------------------------

/**
 * Event listener for clicks anywhere on the document to hide the toolbars.
 */
document.addEventListener('click', function (event) {
    const toolbar = document.getElementById('toolbar');
    const textToolbar = document.getElementById("textToolbar");
    const treeMenu = document.getElementById("treeQuickMenu");

    if (toolbar && !event.target.closest('#boxes') && !event.target.closest('#toolbar')) {
        toolbar.style.display = 'none';
    }

    if (textToolbar && !event.target.closest("#textToolbar")) {
        textToolbar.style.display = 'none';
    }

    // Tree quick-menu only opens on right-click (see initTreeMenu); any
    // left-click outside the menu itself should dismiss it, even if it
    // happens inside the canvas (selecting a box, dragging, etc.).
    if (treeMenu && !event.target.closest('#treeQuickMenu')) {
        treeMenu.classList.remove('visible');
        treeMenu.setAttribute('aria-hidden', 'true');
    }
});

// --------------------------------------------------------------------------
// Box Toolbar Event Listeners
// --------------------------------------------------------------------------

/**
 * Attaches event listeners to the buttons within the box toolbar.
 */
function boxToolbarListeners() {
    // Event listener for the box color picker
    const boxColorInput = document.getElementById("boxColor");
    const boxTextColorInput = document.getElementById("boxTextColor");
    const getToolbarBox = (target) => {
        const toolbar = target.closest('#toolbar');
        return document.getElementById(toolbar?.dataset.boxId || '');
    };
    const applyBoxColor = (e) => {
        const box = getToolbarBox(e.target);
        if (!box) return;
        applyBoxCustomColor(box, e.target.value);
    };
    const applyTextColor = (e) => {
        const box = getToolbarBox(e.target);
        if (!box) return;
        applyBoxTextColor(box, e.target.value);
    };
    boxColorInput.addEventListener("input", applyBoxColor);
    boxColorInput.addEventListener("change", applyBoxColor);
    boxColorInput.addEventListener("click", event => {
        event.stopPropagation();
    });
    boxTextColorInput.addEventListener("input", applyTextColor);
    boxTextColorInput.addEventListener("change", applyTextColor);
    boxTextColorInput.addEventListener("click", event => {
        event.stopPropagation();
    });

    // Event listener for the "addBox" button
    document.getElementById("addBox").addEventListener("click", e => {
        const box = getToolbarBox(e.target);
        addBlock(box);
    });

    // Event listener for the "deleteBox" button
    document.getElementById("deleteBox").addEventListener("click", e => {
        const box = getToolbarBox(e.target);
        deleteBox(box);
    });

    document.getElementById("duplicateBox").addEventListener("click", e => {
        duplicateBox(getToolbarBox(e.target));
    });
}


// --------------------------------------------------------------------------
// Text Highlighting and Link Styling
// --------------------------------------------------------------------------

/**
 * Adds mouseenter and mouseleave event listeners to a span element to apply a glow effect
 * to the associated box.
 * @param {HTMLElement} span - The span element that triggers the glow.
 * @param {string} color - The color of the glow effect.
 */
function addGlow(span, color) {
    span.addEventListener("mouseenter", e => glowBox(e));
    span.addEventListener("mouseleave", e => noGlowBox(e));

    function glowBox(e) {
        const id = e.target.dataset?.boxId;
        document.documentElement.style.setProperty("--glow-color", color);
        document.getElementById(id)?.classList.add("glow");
    }

    function noGlowBox(e) {
        const id = e.target.dataset?.boxId;
        document.getElementById(id)?.classList.remove("glow");
    }
}

// --------------------------------------------------------------------------
// Dropdown Menu for Connecting Boxes
// --------------------------------------------------------------------------

// Toggle the dropdown visibility when the button is hovered over
document.querySelector(".dropdown-button").addEventListener('mouseover', e => {
    const dropdown = e.currentTarget.closest(".dropdown");
    const container = dropdown.querySelector(".dropdown-content");
    const toolbar = dropdown.closest(".toolbar");
    const boxId = toolbar?.dataset.boxId;

    if (!boxId || !boxes.has(boxId)) return;

    container.innerHTML = "";

    const connectedIds = new Set((boxes.get(boxId)?.lines || []).map(String));

    Array.from(boxes.keys())
        .filter(id => id !== boxId)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(id => {
            const item = document.createElement("div");
            item.className = "dropdown-item";

            const lesser = String(Math.min(Number(boxId), Number(id)));
            const greater = String(Math.max(Number(boxId), Number(id)));
            const lineId = `${lesser}_${greater}`;
            const isConnected = connectedIds.has(String(id));

            item.dataset.a = lesser;
            item.dataset.b = greater;
            item.dataset.c = isConnected ? "1" : "0";
            item.textContent = `Box# ${id}${isConnected ? " ✅" : ""}`;

            item.addEventListener("click", evt => {
                const { a, b, c } = evt.currentTarget.dataset;
                if (c === "1") {
                    const existingLine = document.getElementById(`${a}_${b}`);
                    if (existingLine) deleteLine(existingLine);
                } else {
                    newLine(a, b);
                }
            });

            container.appendChild(item);
        });

    dropdown.classList.add("show");
});

document.getElementById("link").addEventListener('mouseleave', () => {
    document.getElementById("link").classList.remove("show");
});


// --------------------------------------------------------------------------
// Color Conversion Functions
// --------------------------------------------------------------------------

/**
 * Converts a color string (hex, rgb, or hsl) to its hexadecimal representation.
 * Returns '#f1f1f1' for invalid color formats.
 * @param {string} color - The color string to convert.
 * @returns {string} The hexadecimal representation of the color.
 */
function colorToHex(color) {
    if (typeof color !== "string") {
        return "#f1f1f1";
    }

    const normalized = color.trim();

    if (!normalized) {
        return "#f1f1f1";
    }

    if (normalized.startsWith("#")) {
        return normalized.length === 4 || normalized.length === 7 ? normalized.toUpperCase() : "#f1f1f1";
    }

    if (normalized.startsWith("rgb")) {
        const rgb = normalized.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
        if (rgb) {
            return rgbToHex(parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10));
        }
    }

    if (normalized.startsWith("hsl")) {
        const hsl = normalized.match(/hsl\(\s*(\d+),\s*(\d+)%,\s*(\d+)%\s*\)/);
        if (hsl) {
            return hslToHex(parseInt(hsl[1], 10), parseInt(hsl[2], 10), parseInt(hsl[3], 10));
        }
    }

    console.warn("Invalid Color ", color);
    return "#f1f1f1";
}

/**
 * Converts RGB color values to a hexadecimal color string.
 * @param {number} r - The red color value (0-255).
 * @param {number} g - The green color value (0-255).
 * @param {number} b - The blue color value (0-255).
 * @returns {string} The hexadecimal representation of the RGB color.
 */
function rgbToHex(r, g, b) {
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
}

function readableTextColor(color) {
    const hex = colorToHex(color);
    const expandedHex = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const red = parseInt(expandedHex.slice(1, 3), 16) / 255;
    const green = parseInt(expandedHex.slice(3, 5), 16) / 255;
    const blue = parseInt(expandedHex.slice(5, 7), 16) / 255;
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    return luminance > 0.55 ? "#111827" : "#F8FAFC";
}

/**
 * Converts HSL color values to a hexadecimal color string.
 * @param {number} h - The hue value (0-360).
 * @param {number} s - The saturation value (0-100).
 * @param {number} l - The lightness value (0-100).
 * @returns {string} The hexadecimal representation of the HSL color.
 */
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = l - c / 2;
    let r, g, b;
    if (h >= 0 && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h >= 180 && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h >= 240 && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else {
        r = c;
        g = 0;
        b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
}

// --------------------------------------------------------------------------
// Canvas Grid Toggle & Panning
// --------------------------------------------------------------------------

function toggleGrid(forceState = null, persist = true) {
    const canvas = document.getElementById('zoom');
    const toggleButton = document.getElementById('gridToggle');
    if (!canvas || !toggleButton) return;

    if (typeof forceState === 'boolean') {
        isGridActive = forceState;
    } else {
        isGridActive = !isGridActive;
    }

    canvas.classList.toggle('grid-on', isGridActive);
    toggleButton.classList.toggle('is-active', isGridActive);
    toggleButton.setAttribute('aria-pressed', String(isGridActive));

    if (persist) {
        try {
            localStorage.setItem('treenotes-grid', isGridActive ? 'true' : 'false');
        } catch (error) {
            console.warn('Unable to persist grid preference', error);
        }
    }
}

function initGridToggle() {
    let savedState = null;
    try {
        savedState = localStorage.getItem('treenotes-grid');
    } catch (error) {
        savedState = null;
    }

    if (savedState === 'true' || savedState === 'false') {
        toggleGrid(savedState === 'true', false);
    } else {
        toggleGrid(false, false);
    }

    const button = document.getElementById('gridToggle');
    if (button) {
        button.addEventListener('click', () => toggleGrid(null, true));
    }
}

function initTreePanning() {
    const container = document.querySelector('#tree .container');
    if (!container) return;

    let isPanning = false;
    let panMoved = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    container.addEventListener('mousedown', event => {
        if (event.button !== 0) return;
        if (
            event.target.closest('.box') ||
            event.target.closest('#toolbarBar') ||
            event.target.closest('#treeQuickMenu') ||
            event.target.closest('.status-message') ||
            event.target.closest('.analysis-panel')
        ) {
            return;
        }

        isPanning = true;
        panMoved = false;
        container.classList.add('is-panning');
        startX = event.clientX;
        startY = event.clientY;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        event.preventDefault();
    });

    window.addEventListener('mousemove', event => {
        if (!isPanning) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (!panMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
            panMoved = true;
        }

        container.scrollLeft = scrollLeft - dx;
        container.scrollTop = scrollTop - dy;
    });

    const endPan = () => {
        if (!isPanning) return;
        isPanning = false;
        container.classList.remove('is-panning');
    };

    window.addEventListener('mouseup', endPan);
    window.addEventListener('blur', endPan);
    container.addEventListener('mouseup', endPan);
    container.addEventListener('mouseleave', endPan);

    container.addEventListener('click', event => {
        if (panMoved) {
            panMoved = false;
            event.stopPropagation();
        }
    }, true);
}

// --------------------------------------------------------------------------
// Assistive Controls (Speech-to-Text & AI Analysis)
// --------------------------------------------------------------------------

function setStatusMessage(message = '', variant = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;

    if (message) {
        statusEl.textContent = message;
        statusEl.classList.add('is-active');
    } else {
        statusEl.textContent = '';
        statusEl.classList.remove('is-active');
    }

    if (variant === 'error') {
        statusEl.classList.add('is-alert');
    } else {
        statusEl.classList.remove('is-alert');
    }
}

function getSpeechRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getDictationPreferences() {
    return {
        language: document.getElementById('dictation-language')?.value || '',
        continuous: document.getElementById('dictation-continuous')?.checked !== false,
        interim: document.getElementById('dictation-interim')?.checked !== false
    };
}

function saveDictationPreferences() {
    try {
        localStorage.setItem(DICTATION_PREFS_STORAGE_KEY, JSON.stringify(getDictationPreferences()));
    } catch (_) {
        // Keep browser defaults if localStorage is unavailable.
    }
}

function syncDictationLanguageOptions(languageSelect = document.getElementById('dictation-language')) {
    if (!languageSelect) return;

    const currentValue = languageSelect.value;
    languageSelect.innerHTML = '';

    for (const language of SUPPORTED_SPEECH_LANGUAGES) {
        const option = document.createElement('option');
        option.value = language.value;
        option.textContent = language.labelKey ? uiText(language.labelKey) : language.label;
        option.lang = language.lang;
        option.dir = RTL_LANGUAGES.has(language.uiCode) ? 'rtl' : 'ltr';
        languageSelect.appendChild(option);
    }

    const hasCurrentValue = SUPPORTED_SPEECH_LANGUAGES.some(language => language.value === currentValue);
    languageSelect.value = hasCurrentValue ? currentValue : '';
}

function initDictationPreferences() {
    const languageSelect = document.getElementById('dictation-language');
    const continuousToggle = document.getElementById('dictation-continuous');
    const interimToggle = document.getElementById('dictation-interim');
    const testButton = document.getElementById('dictationTestBtn');

    syncDictationLanguageOptions(languageSelect);

    try {
        const saved = JSON.parse(localStorage.getItem(DICTATION_PREFS_STORAGE_KEY) || '{}');
        if (languageSelect && typeof saved.language === 'string') languageSelect.value = saved.language;
        if (continuousToggle && typeof saved.continuous === 'boolean') continuousToggle.checked = saved.continuous;
        if (interimToggle && typeof saved.interim === 'boolean') interimToggle.checked = saved.interim;
    } catch (_) {
        // Ignore malformed saved state.
    }

    if (languageSelect && !SUPPORTED_SPEECH_LANGUAGES.some(language => language.value === languageSelect.value)) {
        languageSelect.value = '';
    }

    languageSelect?.addEventListener('change', saveDictationPreferences);
    continuousToggle?.addEventListener('change', saveDictationPreferences);
    interimToggle?.addEventListener('change', saveDictationPreferences);
    testButton?.addEventListener('click', () => {
        const button = document.getElementById('dictateToggle');
        if (isDictating) stopDictation(uiText('dictationStopped'));
        else startDictation(button);
    });
}

function setDictationActive(active, dictateButton = document.getElementById('dictateToggle')) {
    isDictating = active;
    if (dictateButton) {
        dictateButton.classList.toggle('is-active', isDictating);
        dictateButton.setAttribute('aria-pressed', String(isDictating));
        dictateButton.title = isDictating ? uiText('stopDictationTitle') : uiText('dictationTitle');
    }
}

function stopDictation(message = uiText('dictationStopped')) {
    if (dictationRecognition && isDictating) {
        dictationRecognition.stop();
    }
    setDictationActive(false);
    if (message) setStatusMessage(message, 'info');
}

function startDictation(dictateButton) {
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
        setDictationActive(false, dictateButton);
        setStatusMessage(uiText('dictationUnsupported'), 'error');
        return;
    }

    const target = getDictationTarget();
    if (!target) {
        setDictationActive(false, dictateButton);
        setStatusMessage(uiText('dictationSelectTarget'), 'error');
        return;
    }

    dictationRecognition = new Recognition();
    const preferences = getDictationPreferences();
    dictationRecognition.lang = preferences.language || navigator.language || 'en-US';
    dictationRecognition.continuous = preferences.continuous;
    dictationRecognition.interimResults = preferences.interim;

    dictationRecognition.onstart = () => {
        setDictationActive(true, dictateButton);
        setStatusMessage(uiText('dictationActive'), 'info');
    };

    dictationRecognition.onresult = (event) => {
        let finalText = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            if (result.isFinal) finalText += result[0].transcript;
        }
        finalText = finalText.trim();
        if (!finalText) return;
        insertTextIntoEditable(getDictationTarget(), finalText);
    };

    dictationRecognition.onerror = (event) => {
        const message = event.error === 'not-allowed'
            ? 'Microphone permission denied. Enable microphone access to use dictation.'
            : `Dictation error: ${event.error || 'unknown error'}.`;
        setDictationActive(false, dictateButton);
        setStatusMessage(message, 'error');
    };

    dictationRecognition.onend = () => {
        if (isDictating) {
            setDictationActive(false, dictateButton);
            setStatusMessage(uiText('dictationEnded'), 'info');
        }
    };

    try {
        dictationRecognition.start();
    } catch (error) {
        setDictationActive(false, dictateButton);
        setStatusMessage(uiText('dictationStartFailed'), 'error');
    }
}

function gatherCornellNotes() {
    const boxesWrapper = document.getElementById('boxes');
    let noteBody = '';

    if (boxesWrapper) {
        noteBody = Array.from(boxesWrapper.querySelectorAll('.box'))
            .map(box => {
                const id = box.id ? `#${box.id}` : '';
                return `Box ${id}`.trim() + ': ' + getBoxText(box);
            })
            .join('\n');
    }

    return {
        heading: document.getElementById('headingText')?.innerText.trim() || '',
        cues: document.getElementById('cueText')?.innerText.trim() || '',
        notes: noteBody || document.getElementById('tree')?.innerText.trim() || '',
        summary: document.getElementById('notesText')?.innerText.trim() || ''
    };
}

// --------------------------------------------------------------------------
// LLM Insights — markdown renderer + concepts / suggested-links sections
// --------------------------------------------------------------------------

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Tiny markdown subset: bullets (* or -), **bold**, *italic*, _italic_, `code`,
// blank-line separated paragraphs. Enough for what Gemini emits in `analysis`.
function renderInlineMarkdown(escaped) {
    // Bold first so the leftover singles can be parsed as italics safely.
    let out = escaped.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?=[^*\w]|$)/g, '$1<em>$2</em>');
    out = out.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?=[^_\w]|$)/g, '$1<em>$2</em>');
    out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
    return out;
}

function renderSimpleMarkdown(text) {
    if (!text) return '';
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let listOpen = false;
    let paragraphBuf = [];

    const flushParagraph = () => {
        if (!paragraphBuf.length) return;
        const joined = paragraphBuf.join(' ').trim();
        if (joined) {
            html.push('<p>' + renderInlineMarkdown(escapeHtml(joined)) + '</p>');
        }
        paragraphBuf = [];
    };

    for (const raw of lines) {
        const line = raw.trim();
        const bullet = line.match(/^[\*\-]\s+(.*)$/);
        if (bullet) {
            flushParagraph();
            if (!listOpen) { html.push('<ul>'); listOpen = true; }
            html.push('<li>' + renderInlineMarkdown(escapeHtml(bullet[1])) + '</li>');
        } else if (!line) {
            if (listOpen) { html.push('</ul>'); listOpen = false; }
            flushParagraph();
        } else {
            if (listOpen) { html.push('</ul>'); listOpen = false; }
            paragraphBuf.push(line);
        }
    }

    if (listOpen) html.push('</ul>');
    flushParagraph();
    return html.join('');
}

function renderBulletListHtml(items) {
    const values = Array.isArray(items)
        ? items.filter(s => typeof s === 'string' && s.trim())
        : [];
    if (!values.length) return '';
    return '<ul>' + values.map(item => '<li>' + renderInlineMarkdown(escapeHtml(item.trim())) + '</li>').join('') + '</ul>';
}

function renderStructuredAnalysis(data, contentEl) {
    const overviewSection = document.getElementById('analysisOverview');
    const overviewList = document.getElementById('overviewList');
    const swotSection = document.getElementById('analysisSwot');
    const swotList = document.getElementById('swotList');

    if (!overviewSection || !overviewList || !swotSection || !swotList) return false;

    const overviewHtml = renderBulletListHtml(data.overview);
    overviewList.innerHTML = overviewHtml;
    overviewSection.hidden = !overviewHtml;

    const studyAnalysis = data.study_analysis && typeof data.study_analysis === 'object'
        ? data.study_analysis
        : {};
    const groups = [
        ['Strengths', studyAnalysis.strengths],
        ['Weaknesses', studyAnalysis.weaknesses],
        ['Opportunities', studyAnalysis.opportunities],
        ['Threats', studyAnalysis.threats],
        ['Recommended improvements', studyAnalysis.recommended_improvements]
    ];

    swotList.innerHTML = '';
    for (const [title, items] of groups) {
        const html = renderBulletListHtml(items);
        if (!html) continue;
        const group = document.createElement('div');
        group.className = 'swot-group';
        const heading = document.createElement('h5');
        heading.className = 'swot-group__title';
        heading.textContent = title;
        const body = document.createElement('div');
        body.className = 'analysis-panel__content';
        body.innerHTML = html;
        group.append(heading, body);
        swotList.appendChild(group);
    }
    swotSection.hidden = !swotList.children.length;

    if (contentEl) contentEl.innerHTML = '';
    return !!overviewHtml || !!swotList.children.length;
}

function structuredDataFromResponse(data) {
    if (Array.isArray(data.overview) || (data.study_analysis && typeof data.study_analysis === 'object')) {
        return data;
    }
    if (typeof data.analysis !== 'string') return data;
    const raw = data.analysis.trim();
    if (!raw.startsWith('{') && !raw.startsWith('```')) return data;
    const normalizeParsed = (parsed) => {
        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
            } catch (_) {
                return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
            }
        }
        if (parsed?.analysis && typeof parsed.analysis === 'object' && !parsed.overview) {
            parsed = parsed.analysis;
        }
        if (parsed && typeof parsed === 'object') {
            const safeAnalysis = typeof parsed.analysis === 'string' && !parsed.analysis.trim().startsWith('{')
                ? parsed.analysis
                : '';
            return { ...data, ...parsed, analysis: safeAnalysis };
        }
        return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
    };
    const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    try {
        return normalizeParsed(JSON.parse(cleaned));
    } catch (_) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try {
                return normalizeParsed(JSON.parse(cleaned.slice(start, end + 1)));
            } catch (__) {
                return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
            }
        }
    }
    return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
}

function renderConceptsAndSuggestions(data) {
    const conceptsSection = document.getElementById('analysisConcepts');
    const conceptsList = document.getElementById('conceptsList');
    const suggestedSection = document.getElementById('analysisSuggested');
    const suggestedList = document.getElementById('suggestedLinksList');
    let seeAlsoSection = document.getElementById('analysisSeeAlso');
    let seeAlsoList = document.getElementById('seeAlsoList');
    const videosSection = document.getElementById('analysisVideos');
    const videosList = document.getElementById('videosList');

    if (!conceptsSection || !conceptsList || !suggestedSection || !suggestedList) return;

    // Dynamically add the "Further Reading" section right below "Concepts" if missing
    if (!seeAlsoSection) {
        seeAlsoSection = document.createElement('div');
        seeAlsoSection.id = 'analysisSeeAlso';
        seeAlsoSection.hidden = true;
        
        const heading = document.createElement('h4');
        heading.textContent = 'Further Reading';
        seeAlsoSection.appendChild(heading);
        
        seeAlsoList = document.createElement('ul');
        seeAlsoList.id = 'seeAlsoList';
        seeAlsoList.style.paddingLeft = '20px';
        seeAlsoSection.appendChild(seeAlsoList);
        
        conceptsSection.parentNode.insertBefore(seeAlsoSection, conceptsSection.nextSibling);
    }

    const concepts = Array.isArray(data.concepts)
        ? data.concepts.filter(s => typeof s === 'string' && s.trim())
        : [];
    const rawLinks = Array.isArray(data.suggested_links) ? data.suggested_links : [];

    conceptsList.innerHTML = '';
    if (concepts.length) {
        for (const c of concepts) {
            const chip = document.createElement('span');
            chip.className = 'concept-chip';
            chip.textContent = c;
            conceptsList.appendChild(chip);
        }
        conceptsSection.hidden = false;
    } else {
        conceptsSection.hidden = true;
    }

    suggestedList.innerHTML = '';
    // Drop suggestions that point at boxes the user has since renamed/removed,
    // and self-links that the server's sanitizer somehow let through.
    const validLinks = rawLinks.filter(l => {
        const a = String(l?.a ?? '');
        const b = String(l?.b ?? '');
        return a && b && a !== b && boxes.has(a) && boxes.has(b);
    });

    if (validLinks.length) {
        for (const link of validLinks) {
            const a = String(link.a);
            const b = String(link.b);
            const lo = String(Math.min(Number(a), Number(b)));
            const hi = String(Math.max(Number(a), Number(b)));
            const lineId = `${lo}_${hi}`;
            const alreadyLinked = !!document.getElementById(lineId);

            const item = document.createElement('li');
            item.className = 'suggested-link-item';

            const label = document.createElement('span');
            label.className = 'suggested-link-item__label';
            const aContent = typeof link.a_content === 'string' ? link.a_content.trim() : '';
            const bContent = typeof link.b_content === 'string' ? link.b_content.trim() : '';
            label.textContent = `Box ${lo} ↔ Box ${hi}`;
            if (aContent || bContent) {
                const detail = document.createElement('span');
                detail.className = 'suggested-link-item__boxes';
                detail.textContent = `${aContent || 'Empty box'} ↔ ${bContent || 'Empty box'}`;
                label.appendChild(detail);
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'suggested-link-item__btn';
            if (alreadyLinked) {
                btn.textContent = 'Linked ✓';
                btn.disabled = true;
            } else {
                btn.textContent = '+ Create';
                btn.addEventListener('click', () => {
                    // Client-side only — same flow as the box quick-toolbar Link
                    // dropdown. Persist server-side via the existing Save button.
                    newLine(lo, hi);
                    btn.textContent = 'Linked ✓';
                    btn.disabled = true;
                });
            }

            item.append(label, btn);
            suggestedList.appendChild(item);
        }
        suggestedSection.hidden = false;
    } else {
        suggestedSection.hidden = true;
    }

    const seeAlsoLinks = Array.isArray(data.see_also) ? data.see_also : [];
    seeAlsoList.innerHTML = '';
    if (seeAlsoLinks.length) {
        for (const link of seeAlsoLinks) {
            const item = document.createElement('li');
            item.className = 'suggested-link-item';
            item.style.marginBottom = '8px';

            const a = document.createElement('a');
            a.href = link.url || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = `${link.favicon ? `${link.favicon} ` : ''}${link.title || link.url || 'External Link'}`;
            a.style.textDecoration = 'underline';
            a.style.wordBreak = 'break-word';

            item.appendChild(a);
            seeAlsoList.appendChild(item);
        }
        seeAlsoSection.hidden = false;
    } else {
        seeAlsoSection.hidden = true;
    }

    const videoLinks = Array.isArray(data.videos) ? data.videos : [];
    if (videosList) videosList.innerHTML = '';
    if (videosSection && videosList && videoLinks.length) {
        for (const link of videoLinks) {
            const item = document.createElement('li');
            item.className = 'suggested-link-item video-link-item';
            item.style.marginBottom = '8px';

            const a = document.createElement('a');
            a.href = link.url || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'video-link-item__anchor';
            a.style.textDecoration = 'underline';
            a.style.wordBreak = 'break-word';
            if (link.thumbnail) {
                const img = document.createElement('img');
                img.className = 'video-link-item__thumbnail';
                img.src = link.thumbnail;
                img.alt = '';
                img.loading = 'lazy';
                a.appendChild(img);
            }
            const label = document.createElement('span');
            label.textContent = link.title || link.url || 'Video';
            a.appendChild(label);
            if (link.channel) {
                const channel = document.createElement('span');
                channel.className = 'video-link-item__channel';
                channel.textContent = link.channel;
                a.appendChild(channel);
            }

            item.appendChild(a);
            videosList.appendChild(item);
        }
        videosSection.hidden = false;
    } else if (videosSection) {
        videosSection.hidden = true;
    }
}

function getAiPreferences() {
    const provider = document.getElementById('llm-provider')?.value || 'auto';
    const model = document.getElementById('llm-model')?.value || '';
    const proMode = !!document.getElementById('pro-mode')?.checked;
    const geminiApiKey = document.getElementById('gemini-api-key')?.value.trim() || '';
    const openaiApiKey = document.getElementById('openai-api-key')?.value.trim() || '';
    const ollamaBaseUrl = document.getElementById('ollama-base-url')?.value.trim() || '';
    return { provider, model, proMode, geminiApiKey, openaiApiKey, ollamaBaseUrl };
}

function saveAiPreferences() {
    try {
        localStorage.setItem(AI_PREFS_STORAGE_KEY, JSON.stringify(getAiPreferences()));
    } catch (_) {
        // localStorage can fail in private browsing; defaults still work.
    }
}

function updateAiModelOptions() {
    const providerSelect = document.getElementById('llm-provider');
    const modelSelect = document.getElementById('llm-model');
    if (!providerSelect || !modelSelect) return;

    const provider = providerSelect.value;
    for (const option of modelSelect.options) {
        const optionProvider = option.dataset.provider || '';
        option.hidden = !!optionProvider && provider !== 'auto' && optionProvider !== provider;
    }
    const selected = modelSelect.selectedOptions[0];
    if (selected?.hidden) modelSelect.value = '';
}

function initAiPreferences() {
    const providerSelect = document.getElementById('llm-provider');
    const modelSelect = document.getElementById('llm-model');
    const proToggle = document.getElementById('pro-mode');
    const geminiKeyInput = document.getElementById('gemini-api-key');
    const openaiKeyInput = document.getElementById('openai-api-key');
    const ollamaUrlInput = document.getElementById('ollama-base-url');
    if (!providerSelect || !modelSelect || !proToggle) return;

    try {
        const saved = JSON.parse(localStorage.getItem(AI_PREFS_STORAGE_KEY) || '{}');
        if (typeof saved.provider === 'string') providerSelect.value = saved.provider;
        if (typeof saved.model === 'string') modelSelect.value = saved.model;
        proToggle.checked = !!saved.proMode;
        if (geminiKeyInput && typeof saved.geminiApiKey === 'string') geminiKeyInput.value = saved.geminiApiKey;
        if (openaiKeyInput && typeof saved.openaiApiKey === 'string') openaiKeyInput.value = saved.openaiApiKey;
        if (ollamaUrlInput && typeof saved.ollamaBaseUrl === 'string') ollamaUrlInput.value = saved.ollamaBaseUrl;
    } catch (_) {
        // Ignore malformed saved state and keep defaults.
    }

    updateAiModelOptions();
    providerSelect.addEventListener('change', () => {
        updateAiModelOptions();
        saveAiPreferences();
    });
    modelSelect.addEventListener('change', saveAiPreferences);
    proToggle.addEventListener('change', saveAiPreferences);
    geminiKeyInput?.addEventListener('change', saveAiPreferences);
    openaiKeyInput?.addEventListener('change', saveAiPreferences);
    ollamaUrlInput?.addEventListener('change', saveAiPreferences);
}

function initUiLanguagePreference() {
    const languageSelect = document.getElementById('ui-language');
    if (!languageSelect) return;
    syncUiLanguageOptions(languageSelect);

    try {
        const requested = new URLSearchParams(window.location.search).get('ui-language');
        const saved = requested || localStorage.getItem(UI_LANGUAGE_STORAGE_KEY) || 'en';
        languageSelect.value = normalizeUiLanguage(saved);
    } catch (_) {
        languageSelect.value = 'en';
    }
    applyUiLanguage(languageSelect.value, false);

    const onLanguageSelect = () => {
        applyAndStoreUiLanguage(languageSelect.value, true);
    };
    languageSelect.addEventListener('input', onLanguageSelect);
    languageSelect.addEventListener('change', onLanguageSelect);
}

function normalizeUiLanguage(language) {
    const normalized = String(language || 'en').trim().toLowerCase().replace('_', '-');
    const primary = normalized.split('-')[0];
    if (UI_LANGUAGE_ALIASES[normalized]) return UI_LANGUAGE_ALIASES[normalized];
    if (SUPPORTED_UI_LANGUAGE_CODES.has(normalized) && UI_TRANSLATIONS[normalized]) return normalized;
    if (SUPPORTED_UI_LANGUAGE_CODES.has(primary) && UI_TRANSLATIONS[primary]) return primary;
    return 'en';
}

function syncUiLanguageOptions(languageSelect) {
    const currentValue = normalizeUiLanguage(languageSelect.value);
    languageSelect.innerHTML = '';
    for (const language of SUPPORTED_UI_LANGUAGES) {
        const option = document.createElement('option');
        option.value = language.code;
        option.textContent = language.nativeName;
        option.lang = language.code;
        option.dir = RTL_LANGUAGES.has(language.code) ? 'rtl' : 'ltr';
        languageSelect.appendChild(option);
    }
    languageSelect.value = currentValue;
}

function uiText(key, language = getCurrentUiLanguage()) {
    const normalized = normalizeUiLanguage(language);
    return UI_TRANSLATIONS[normalized]?.[key] || UI_TRANSLATIONS.en[key] || key;
}

function getCurrentUiLanguage() {
    const selected = normalizeUiLanguage(document.getElementById('ui-language')?.value);
    if (selected && UI_TRANSLATIONS[selected]) return selected;
    try {
        const saved = normalizeUiLanguage(localStorage.getItem(UI_LANGUAGE_STORAGE_KEY));
        if (saved && UI_TRANSLATIONS[saved]) return saved;
    } catch (_) {}
    return 'en';
}

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
}

function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(element => {
        element.textContent = value;
    });
}

function setAttr(selector, attr, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attr, value);
}

function applyUiLanguage(language = 'en', announce = false) {
    language = normalizeUiLanguage(language);
    const t = key => uiText(key, language);
    const languageSelect = document.getElementById('ui-language');
    if (languageSelect && languageSelect.value !== language) languageSelect.value = language;
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
    document.documentElement.dataset.textDirection = document.documentElement.dir;
    document.documentElement.dataset.uiLanguage = language;
    document.title = `${t('appTitle')} (${t('openBeta')})`;

    setText('#title-bar h1', t('appTitle'));
    setText('.menu-header', t('menuTitle'));
    setText('#apiNewBtn span:last-child', t('new'));
    setText('#apiOpenBtn span:last-child', t('cloudOpen'));
    setText('#apiSaveBtn span:last-child', t('cloudSave'));
    setText('#localOpenBtn span:last-child', t('localOpen'));
    setText('#localSaveBtn span:last-child', t('localSave'));
    setText('#toggleDarkMode span:last-child', t('toggleTheme'));
    setText('#aiSettingsDetails > summary', t('aiSettings'));
    setText('label[for="llm-provider"]', t('aiProvider'));
    setText('label[for="llm-model"]', t('aiModel'));
    setText('label[for="gemini-api-key"]', t('geminiKey'));
    setText('label[for="openai-api-key"]', t('openaiKey'));
    setText('label[for="ollama-base-url"]', t('ollamaUrl'));
    setText('label[for="api-base-url"]', t('backendUrl'));
    setText('#aiSettingsDetails .menu-hint', t('aiHint'));
    setText('#pro-mode + span', t('proMode'));
    const proHint = document.querySelector('#pro-mode')?.closest('.menu-section')?.querySelector('.menu-hint');
    if (proHint) proHint.textContent = t('proHint');
    setText('#dictationSettingsDetails > summary', t('dictationSettings'));
    syncDictationLanguageOptions();
    setText('label[for="dictation-language"]', t('speechLanguage'));
    setText('#dictation-continuous + span', t('continuousListening'));
    setText('#dictation-interim + span', t('interimRecognition'));
    setText('#dictationTestBtn span:last-child', t('testDictation'));
    setText('#dictationSettingsDetails .menu-hint', t('dictationHint'));
    setText('label[for="ui-language"]', t('uiLanguage'));
    const languageHint = document.querySelector('#ui-language')?.closest('.menu-section')?.querySelector('.menu-hint');
    if (languageHint) languageHint.textContent = t('uiLanguageHint');
    setText('#about span:last-child', t('about'));
    setText('#help span:last-child', t('help'));
    setText('#feedback span:last-child', t('feedback'));

    setAttr('#headingText', 'data-placeholder', t('headingPlaceholder'));
    setText('#headingColorMenu label:first-child span', t('backgroundColor'));
    setText('#headingColorMenu label:last-child span', t('textColor'));
    setAttr('.heading-color-controls', 'aria-label', t('headingColorSettings'));
    setAttr('#headingColorMenuToggle', 'aria-label', t('headingColorSettings'));
    setAttr('#headingColorMenuToggle', 'title', t('headingColorSettings'));
    setAttr('#headingColorMenu', 'aria-label', t('headingColorSettings'));
    setAttr('#headingColorMenu label:first-child', 'title', t('backgroundColor'));
    setAttr('#headingColorMenu label:last-child', 'title', t('textColor'));
    setAttr('#headingColor', 'aria-label', t('backgroundColor'));
    setAttr('#headingTextColor', 'aria-label', t('textColor'));
    setText('#text .column-title', t('cueColumn'));
    setAttr('#cueText', 'data-placeholder', t('cuePlaceholder'));
    setText('.column-title--summary', t('summary'));
    setAttr('#notesText', 'data-placeholder', t('summaryPlaceholder'));

    setText('#analysisPanel .analysis-panel__title', t('llmInsights'));
    setText('#analysisOverview .analysis-panel__section-title', t('overview'));
    setText('#analysisSwot .analysis-panel__section-title', t('analysis'));
    setText('#analysisConcepts .analysis-panel__section-title', t('concepts'));
    setText('#analysisSuggested .analysis-panel__section-title', t('suggestedLinks'));
    setText('#analysisSeeAlso .analysis-panel__section-title', t('seeAlso'));
    setText('#analysisVideos .analysis-panel__section-title', t('videos'));

    setText('#toolbar .toolbar-color-button:first-child span', t('cell'));
    setText('#toolbar .toolbar-color-button:nth-child(2) span', t('textColor'));
    setText('#addBox', t('addBox'));
    setText('#deleteBox', t('deleteBox'));
    setText('#duplicateBox', t('duplicateBox'));
    setText('#link .dropdown-button', t('linkSystem'));

    setText('#apiOpenDialog .api-open-dialog__header', t('openServer'));
    setText('#apiOpenRefresh', t('refresh'));
    setText('#apiOpenCancel', t('close'));
    setText('#helpDialog .api-open-dialog__header', t('helpTitle'));
    setText('#helpDialog h3', t('howToUse'));
    const helpItems = document.querySelectorAll('#helpDialog li');
    if (helpItems[0]) helpItems[0].innerHTML = `<strong>${escapeHtml(t('helpAddBoxes'))}</strong> ${escapeHtml(t('helpAddBoxesText'))}`;
    if (helpItems[1]) helpItems[1].innerHTML = `<strong>${escapeHtml(t('helpLinkBoxes'))}</strong> ${escapeHtml(t('helpLinkBoxesText'))}`;
    if (helpItems[2]) helpItems[2].innerHTML = `<strong>${escapeHtml(t('helpAnalyzeAi'))}</strong> ${escapeHtml(t('helpAnalyzeAiText'))}`;
    setText('#helpDialog .api-open-dialog__actions button', t('close'));
    setText('#aboutDialog .api-open-dialog__header', t('aboutTitle'));
    setText('#aboutDialog .api-open-dialog__actions button', t('close'));
    setText('#feedbackDialog .api-open-dialog__header', t('feedbackTitle'));
    setText('label[for="feedbackMessage"]', t('feedbackMessage'));
    setAttr('#feedbackMessage', 'placeholder', t('feedbackPlaceholder'));
    setText('#feedbackDialog .menu-hint', t('feedbackHint'));
    setText('#feedbackEmailBtn', t('openEmail'));
    setText('#feedbackForumBtn', t('forumsDiscord'));
    setText('#feedbackDialog .api-open-dialog__actions button:last-child', t('close'));

    setText('.tree-menu__item[data-action="info"]', t('info'));
    setText('.tree-menu__item[data-action="help"]', t('help'));
    setText('.tree-menu__item[data-action="dark"]', t('toggleTheme'));

    setAttr('#menuIcon', 'aria-label', t('openMenu'));
    setAttr('#menuIcon', 'title', t('openMenu'));
    setAttr('#toolbarBar button[onclick="createNewBlock()"]', 'title', t('addBoxTitle'));
    setAttr('#toolbarBar button[onclick="zoom(1.1)"]', 'title', t('zoomInTitle'));
    setAttr('#toolbarBar button[onclick="zoom(0.9)"]', 'title', t('zoomOutTitle'));
    setAttr('#gridToggle', 'title', t('gridTitle'));
    setAttr('#dictateToggle', 'title', t('dictationTitle'));
    setAttr('#analyzeNotesBtn', 'title', t('analyzeTitle'));
    setAttr('#coachModeBtn', 'title', t('coachTitle'));
    setAttr('#toolbarBar button[onclick="download()"]', 'title', t('downloadTitle'));
    setAttr('#toolbarBar button[onclick="upload()"]', 'title', t('uploadTitle'));
    setAttr('#toolbarBar button[onclick="noteInfo()"]', 'title', t('noteInfoTitle'));

    refreshPlaceholderState(['headingText', 'cueText', 'notesText']);
    updateConnectionStatusButton(connectionStatusState);
    if (announce) setStatusMessage(t('languageApplied'), 'info');
}

function applyAndStoreUiLanguage(language, announce = true) {
    const normalized = normalizeUiLanguage(language);
    try {
        localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, normalized);
    } catch (_) {}
    applyUiLanguage(normalized, announce);
    return normalized;
}

window.TreeNotesLanguages = {
    buildId: UI_LANGUAGE_BUILD_ID,
    supported: SUPPORTED_UI_LANGUAGES.map(language => ({ ...language })),
    apply(language, announce = true) {
        return applyAndStoreUiLanguage(language, announce);
    },
    current: getCurrentUiLanguage
};

function initFeedbackControls() {
    const feedbackButton = document.getElementById('feedback');
    const feedbackDialog = document.getElementById('feedbackDialog');
    const emailButton = document.getElementById('feedbackEmailBtn');
    const forumButton = document.getElementById('feedbackForumBtn');

    feedbackButton?.addEventListener('click', () => feedbackDialog?.showModal());
    emailButton?.addEventListener('click', () => {
        const message = document.getElementById('feedbackMessage')?.value.trim() || '';
        const subject = encodeURIComponent(uiText('feedbackSubject'));
        const body = encodeURIComponent(message || uiText('feedbackBodyFallback'));
        window.location.href = `mailto:treenotes.feedback@example.com?subject=${subject}&body=${body}`;
    });
    forumButton?.addEventListener('click', () => {
        setStatusMessage(uiText('forumsUnavailable'), 'info');
    });
}

function openInsightsPanel(panel) {
    if (!panel) return;
    panel.classList.add('is-open');
    document.body.classList.add('has-insights');
}

function closeInsightsPanel(panel) {
    if (!panel) return;
    panel.classList.remove('is-open');
    document.body.classList.remove('has-insights');
}

function resetAnalysisContent(contentEl) {
    if (contentEl) contentEl.innerHTML = '';
    const overviewSection = document.getElementById('analysisOverview');
    const swotSection = document.getElementById('analysisSwot');
    const conceptsSection = document.getElementById('analysisConcepts');
    const suggestedSection = document.getElementById('analysisSuggested');
    const seeAlsoSection = document.getElementById('analysisSeeAlso');
    const videosSection = document.getElementById('analysisVideos');
    if (overviewSection) overviewSection.hidden = true;
    if (swotSection) swotSection.hidden = true;
    if (conceptsSection) conceptsSection.hidden = true;
    if (suggestedSection) suggestedSection.hidden = true;
    if (seeAlsoSection) seeAlsoSection.hidden = true;
    if (videosSection) videosSection.hidden = true;
}

function setAnalysisPanelTitle(title) {
    const titleEl = document.querySelector('#analysisPanel .analysis-panel__title');
    if (titleEl) titleEl.textContent = title;
}

function clearAnalysisPanel(panel, contentEl) {
    closeInsightsPanel(panel);
    resetAnalysisContent(contentEl);
}

async function analyzeNotesWithLLM() {
    const analyzeBtn = document.getElementById('analyzeNotesBtn');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');

    if (!analyzeBtn || !panel || !contentEl) return;

    setAnalysisPanelTitle(uiText('llmInsights'));
    const body = aiAnalyzeBodyFromCanvas();

    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('is-active');
    // Wipe stale insights but keep the sidebar in whatever state the user
    // left it (open / closed) — the success path will open it again.
    resetAnalysisContent(contentEl);
    setStatusMessage(uiText('callingAnalysisApi'), 'info');

    const base = getApiBase();
    const url = `${base}/ai/analyze`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(errText || `HTTP ${response.status}`);
        }

        const data = structuredDataFromResponse(await response.json());
        const status = data.status;
        const analysis = (data.analysis || '').trim();
        const message = (data.message || '').trim();

        if (status === 'ok') {
            const renderedStructured = renderStructuredAnalysis(data, contentEl);
            if (!renderedStructured) {
                contentEl.innerHTML = analysis
                    ? renderSimpleMarkdown(analysis)
                    : '<p><em>The model returned no narrative summary, but you can still review the concepts and suggested links below.</em></p>';
            }
            renderConceptsAndSuggestions(data);
            openInsightsPanel(panel);
            setStatusMessage(uiText('analysisComplete'), 'info');
            return;
        }

        if (status === 'placeholder') {
            setStatusMessage(
                message || uiText('analysisUnavailable'),
                'error'
            );
            return;
        }

        setStatusMessage(message || uiText('analysisFailed'), 'error');
    } catch (error) {
        console.error('LLM analysis error:', error);
        setStatusMessage(
            uiText('apiUnreachable').replace('{url}', url),
            'error'
        );
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('is-active');
    }
}

function buildLocalCoachPuzzles() {
    const notes = gatherCornellNotes();
    const text = [
        notes.heading,
        notes.cues,
        notes.notes,
        notes.summary
    ].filter(Boolean).join('\n');
    const boxTerms = [...boxes.values()]
        .map(({ box }) => getBoxText(box))
        .filter(Boolean)
        .slice(0, 4);
    const puzzles = [];

    if (notes.summary) {
        puzzles.push({
            id: 'local-q1',
            type: 'short_answer',
            prompt: 'Explain the main idea of these notes in your own words.',
            answer: notes.summary,
            acceptable_answers: boxTerms,
            explanation: 'Good recall starts with a concise summary before checking details.'
        });
    }

    if (boxTerms.length >= 3) {
        puzzles.push({
            id: 'local-q2',
            type: 'multiple_choice',
            prompt: `Which cell is a key term from these notes?`,
            choices: boxTerms.slice(0, 4).map((term, index) => ({ id: String.fromCharCode(65 + index), text: term })),
            answer: 'A',
            acceptable_answers: [],
            explanation: 'The correct choice is pulled directly from your seed cells. If missed, compare the options and try again.'
        });
    }

    for (const [index, term] of boxTerms.entries()) {
        puzzles.push({
            id: `local-q${index + 3}`,
            type: 'short_answer',
            prompt: `What does “${term}” connect to, and why is that connection useful?`,
            answer: term,
            acceptable_answers: [term],
            explanation: 'Coach Mode focuses on reasoning about links between note cells, not punishment for wrong answers.'
        });
    }

    if (text) {
        puzzles.push({
            id: `local-q${puzzles.length + 1}`,
            type: 'short_answer',
            prompt: 'Name one weak spot or missing detail that would improve these notes.',
            answer: 'A missing example, definition, link, or clearer summary.',
            acceptable_answers: ['example', 'definition', 'link', 'summary'],
            explanation: 'This turns review into active note improvement, similar to a study coach.'
        });
    }

    return puzzles.slice(0, 7);
}

function renderCoachPuzzles(puzzles, contentEl) {
    const usable = Array.isArray(puzzles) ? puzzles : [];
    if (!usable.length) {
        contentEl.innerHTML = '<p><strong>Coach Mode 🧠</strong></p><p>Add cue text, summary text, or seed cells first. Coach Mode can then quiz your content for retention with explanations.</p>';
        return;
    }

    contentEl.innerHTML = `<p><strong>Coach Mode 🧠</strong> Try the puzzle. If you miss it, there is no penalty: review the explanation and try again.</p>`;
    const list = document.createElement('ol');
    list.className = 'coach-question-list';

    usable.forEach((puzzle, index) => {
        const item = document.createElement('li');
        item.className = 'coach-question';
        item.dataset.answer = puzzle.answer || '';
        item.dataset.type = puzzle.type || 'short_answer';

        const prompt = document.createElement('p');
        prompt.className = 'coach-question__prompt';
        prompt.textContent = puzzle.prompt || `Puzzle ${index + 1}`;
        item.appendChild(prompt);

        const feedback = document.createElement('p');
        feedback.className = 'coach-question__feedback';

        if (puzzle.type === 'multiple_choice' && Array.isArray(puzzle.choices) && puzzle.choices.length) {
            const choices = document.createElement('div');
            choices.className = 'coach-choice-list';
            puzzle.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'coach-choice';
                btn.dataset.choiceId = choice.id;
                btn.textContent = `${choice.id}. ${choice.text}`;
                btn.addEventListener('click', () => {
                    const correct = String(choice.id) === String(puzzle.answer);
                    btn.classList.toggle('is-correct', correct);
                    btn.classList.toggle('is-incorrect', !correct);
                    feedback.textContent = correct
                        ? 'Correct. Read the explanation to reinforce the idea.'
                        : 'Not quite. No penalty — use the explanation, then try again.';
                    feedback.className = `coach-question__feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
                });
                choices.appendChild(btn);
            });
            item.appendChild(choices);
        } else {
            const answerRow = document.createElement('div');
            answerRow.className = 'coach-short-answer';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Type a short answer...';
            const check = document.createElement('button');
            check.type = 'button';
            check.textContent = 'Check';
            check.addEventListener('click', () => {
                const given = input.value.trim().toLowerCase();
                const acceptable = [puzzle.answer, ...(puzzle.acceptable_answers || [])]
                    .map(value => String(value || '').trim().toLowerCase())
                    .filter(Boolean);
                const correct = acceptable.some(answer => given && (given.includes(answer) || answer.includes(given)));
                feedback.textContent = correct
                    ? 'Good answer. Compare it with the explanation.'
                    : 'Not quite. Try again after reading the explanation.';
                feedback.className = `coach-question__feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
            });
            answerRow.append(input, check);
            item.appendChild(answerRow);
        }

        item.appendChild(feedback);
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'Explanation';
        const explanation = document.createElement('p');
        explanation.textContent = puzzle.explanation || 'Review the relevant note detail, then try again.';
        details.append(summary, explanation);
        item.appendChild(details);
        list.appendChild(item);
    });

    contentEl.appendChild(list);
}

async function showCoachMode() {
    const coachButton = document.getElementById('coachModeBtn');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');
    if (!panel || !contentEl) return;

    resetAnalysisContent(contentEl);
    setAnalysisPanelTitle('Coach Mode 🧠');
    openInsightsPanel(panel);
    coachButton?.classList.add('is-active');
    if (coachButton) coachButton.disabled = true;
    contentEl.innerHTML = '<p><strong>Coach Mode 🧠</strong> Building study puzzles…</p>';
    setStatusMessage(uiText('callingCoachApi'), 'info');

    const url = `${getApiBase()}/ai/coach`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiAnalyzeBodyFromCanvas())
        });
        if (!response.ok) throw new Error(await response.text().catch(() => `HTTP ${response.status}`));
        const data = await response.json();
        const puzzles = Array.isArray(data.puzzles) && data.puzzles.length
            ? data.puzzles
            : buildLocalCoachPuzzles();
        renderCoachPuzzles(puzzles, contentEl);
        setStatusMessage(data.status === 'ok' ? uiText('coachReady') : (data.message || uiText('coachLocal')), data.status === 'error' ? 'error' : 'info');
    } catch (error) {
        console.error('Coach Mode error:', error);
        renderCoachPuzzles(buildLocalCoachPuzzles(), contentEl);
        setStatusMessage(uiText('coachUnavailable'), 'error');
    } finally {
        if (coachButton) coachButton.disabled = false;
        coachButton?.classList.remove('is-active');
    }
}

function initToolbarAssistControls() {
    const dictateButton = document.getElementById('dictateToggle');
    const analyzeButton = document.getElementById('analyzeNotesBtn');
    const coachButton = document.getElementById('coachModeBtn');
    const closeAnalysis = document.getElementById('closeAnalysis');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');

    if (dictateButton) {
        setDictationActive(false, dictateButton);

        dictateButton.addEventListener('click', () => {
            if (isDictating) {
                stopDictation(uiText('dictationStopped'));
            } else {
                startDictation(dictateButton);
            }
        });
    }

    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeNotesWithLLM);
    }

    if (coachButton) {
        coachButton.addEventListener('click', showCoachMode);
    }

    if (closeAnalysis && panel && contentEl) {
        closeAnalysis.addEventListener('click', (event) => {
            event.stopPropagation();
            clearAnalysisPanel(panel, contentEl);
            setAnalysisPanelTitle(uiText('llmInsights'));
            setStatusMessage('', 'info');
        });
    }

    // Make the LLM Insights header collapse/expand the body, and remember the
    // user's preference between sessions so opening another note keeps the same
    // layout. The close (✕) button stops propagation above so it never toggles.
    const analysisHeader = document.getElementById('analysisHeader');
    if (analysisHeader && panel) {
        const STORAGE_KEY = 'treenotes-analysis-collapsed';
        const apply = (collapsed) => {
            panel.classList.toggle('is-collapsed', collapsed);
            analysisHeader.setAttribute('aria-expanded', String(!collapsed));
        };
        try {
            apply(localStorage.getItem(STORAGE_KEY) === '1');
        } catch (_) {
            // localStorage may be unavailable (private mode); default to expanded.
            apply(false);
        }
        analysisHeader.addEventListener('click', (event) => {
            if (event.target.closest('.analysis-panel__close')) return;
            const next = !panel.classList.contains('is-collapsed');
            apply(next);
            try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch (_) {}
        });
    }

    setStatusMessage('', 'info');
}

function noteInfo() {
    const { heading, cues, notes, summary } = gatherCornellNotes();
    alert(
        [
            heading ? `Heading: ${heading}` : 'Heading: (empty)',
            cues ? `Cue items: ${cues}` : 'Cue items: (empty)',
            notes ? `Notes: ${notes}` : 'Notes: (empty)',
            summary ? `Summary: ${summary}` : 'Summary: (empty)'
        ].join('\n\n')
    );
}

// --------------------------------------------------------------------------
// API (FastAPI backend)
// --------------------------------------------------------------------------

const TREENOTES_API_BASE_KEY = 'treenotes-api-base';
const TREENOTES_NOTE_ID_KEY = 'treenotes-current-note-id';

function getApiBase() {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('api');
    if (fromQuery) return fromQuery.replace(/\/$/, '');

    const stored = localStorage.getItem(TREENOTES_API_BASE_KEY);
    if (stored) return stored.replace(/\/$/, '');

    const meta = document.querySelector('meta[name="treenotes-api-base"]');
    if (meta?.content?.trim()) {
        const c = meta.content.trim();
        if (c.startsWith('/')) {
            return `${location.origin}${c.replace(/\/$/, '')}`;
        }
        return c.replace(/\/$/, '');
    }

    if (typeof window.TREENOTES_API_BASE === 'string' && window.TREENOTES_API_BASE.trim()) {
        return window.TREENOTES_API_BASE.trim().replace(/\/$/, '');
    }
    return 'http://127.0.0.1:8000';
}

function connectionLabelKey(state = connectionStatusState) {
    switch (state) {
        case 'online':
            return 'connectionOnline';
        case 'offline':
            return 'connectionOffline';
        case 'checking':
            return 'connectionChecking';
        case 'limited':
        default:
            return 'connectionLimited';
    }
}

function updateConnectionStatusButton(state = connectionStatusState) {
    connectionStatusState = state;
    const button = document.getElementById('connectionStatusBtn');
    if (!button) return;

    const normalized = ['online', 'limited', 'offline', 'checking'].includes(state) ? state : 'limited';
    const label = uiText(connectionLabelKey(normalized));
    const title = `${uiText('checkConnectionTitle')}: ${label}`;

    button.classList.remove('is-online', 'is-limited', 'is-offline', 'is-checking');
    button.classList.add(`is-${normalized}`);
    button.dataset.status = normalized;
    button.title = title;
    button.setAttribute('aria-label', title);

    const labelEl = button.querySelector('.connection-status-label');
    if (labelEl) labelEl.textContent = label;
}

async function checkBackendConnection({ announce = false } = {}) {
    if (navigator.onLine === false) {
        updateConnectionStatusButton('offline');
        if (announce) setStatusMessage(uiText('connectionOffline'), 'error');
        return 'offline';
    }

    updateConnectionStatusButton('checking');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

    try {
        const response = await fetch(`${getApiBase()}/health`, {
            cache: 'no-store',
            signal: controller.signal
        });
        const nextState = response.ok ? 'online' : 'limited';
        updateConnectionStatusButton(nextState);
        if (announce) {
            setStatusMessage(uiText(connectionLabelKey(nextState)), nextState === 'online' ? 'info' : 'error');
        }
        return nextState;
    } catch (_) {
        updateConnectionStatusButton('limited');
        if (announce) setStatusMessage(uiText('connectionLimited'), 'error');
        return 'limited';
    } finally {
        window.clearTimeout(timeout);
    }
}

function initConnectionStatus() {
    updateConnectionStatusButton(navigator.onLine === false ? 'offline' : 'checking');

    document.getElementById('connectionStatusBtn')?.addEventListener('click', () => {
        void checkBackendConnection({ announce: true });
    });

    window.addEventListener('online', () => {
        void checkBackendConnection();
    });
    window.addEventListener('offline', () => {
        updateConnectionStatusButton('offline');
    });

    void checkBackendConnection();
    if (connectionStatusTimer) window.clearInterval(connectionStatusTimer);
    connectionStatusTimer = window.setInterval(() => {
        void checkBackendConnection();
    }, 30000);
}

let currentNoteId = sessionStorage.getItem(TREENOTES_NOTE_ID_KEY) || null;

function setCurrentNoteId(id) {
    currentNoteId = id || null;
    if (id) sessionStorage.setItem(TREENOTES_NOTE_ID_KEY, id);
    else sessionStorage.removeItem(TREENOTES_NOTE_ID_KEY);
    updateApiNoteIndicator();
}

function updateApiNoteIndicator() {
    const el = document.getElementById('apiNoteIndicator');
    if (!el) return;
    if (!currentNoteId) {
        el.hidden = true;
        el.textContent = '';
        return;
    }
    el.hidden = false;
    el.textContent = currentNoteId.slice(0, 8) + '…';
    el.title = 'Server note: ' + currentNoteId;
}

function replaceUrlNoteParam(noteId) {
    const url = new URL(location.href);
    if (noteId) url.searchParams.set('note', noteId);
    else url.searchParams.delete('note');
    history.replaceState({}, '', url);
}

function collectNotebookPayload() {
    return {
        heading: document.getElementById("headingText").innerText.trim(),
        headingStyle: getHeadingStylePayload(),
        cueText: document.getElementById("cueText").innerText.trim(),
        summary: document.getElementById("notesText").innerText.trim(),
        boxes: [...boxes.entries()].map(([id, { box, lines }]) => ({
            id,
            content: getBoxText(box),
            style: {
                left: box.style.left,
                top: box.style.top,
                backgroundColor: box.classList.contains('has-custom-color') ? box.style.backgroundColor : null,
                color: box.classList.contains('has-custom-text-color') ? box.style.color : null
            },
            lines: lines.map(String)
        }))
    };
}

function apiBodyFromCanvas() {
    const raw = collectNotebookPayload();
    return {
        heading: raw.heading,
        headingStyle: raw.headingStyle,
        cueText: raw.cueText,
        summary: raw.summary,
        boxes: raw.boxes.map(b => ({
            id: Number(b.id),
            content: b.content,
            style: {
                left: b.style.left || '0px',
                top: b.style.top || '20px',
                backgroundColor: b.style.backgroundColor || null,
                color: b.style.color || null
            },
            lines: (b.lines || []).map(String)
        }))
    };
}

function aiAnalyzeBodyFromCanvas() {
    const body = apiBodyFromCanvas();
    const aiPrefs = getAiPreferences();
    return {
        ...body,
        llm_provider: aiPrefs.provider,
        llm_model: aiPrefs.model,
        pro_mode: aiPrefs.proMode,
        gemini_api_key: aiPrefs.geminiApiKey,
        openai_api_key: aiPrefs.openaiApiKey,
        ollama_base_url: aiPrefs.ollamaBaseUrl
    };
}

function applyImportedData(data) {
    document.getElementById("headingText").innerText = data.heading || "";
    applyHeadingStylePayload(data.headingStyle || {});
    document.getElementById("cueText").innerText = data.cueText || "";
    document.getElementById("notesText").innerText = data.summary || "";
    // Programmatic innerText assignments above don't fire `input`, so the
    // placeholder system never re-evaluates whether the field is "empty".
    // Recompute it explicitly so placeholder text stops rendering on top of
    // the freshly imported content.
    refreshPlaceholderState(['headingText', 'cueText', 'notesText']);
    document.getElementById("boxes").innerHTML = '';
    document.getElementById("lines").innerHTML = '';
    boxes.clear();
    totalBoxes = 0;

    (data.boxes || []).forEach(({ id, content, style, lines }) => {
        const left = parseInt(style?.left, 10) || 0;
        const top = parseInt(style?.top, 10) || 0;
        const newBox = createNewBlock(left, top, content, { id, contentIsPlaceholder: false });

        if (style?.backgroundColor) {
            if (colorToHex(style.backgroundColor) !== '#F1F1F1') {
                applyBoxCustomColor(newBox, style.backgroundColor);
            } else {
                newBox.style.backgroundColor = '';
                newBox.style.color = '';
                newBox.classList.remove('has-custom-color');
            }
        }

        if (style?.color) {
            applyBoxTextColor(newBox, style.color);
        }

        const entry = boxes.get(newBox.id);
        entry.lines = Array.isArray(lines) ? [...new Set(lines.map(String))] : [];
    });

    (data.boxes || []).forEach(({ id, lines }) => {
        (lines || []).forEach(linkId => {
            newLine(String(id), String(linkId));
        });
    });
}

async function saveNotebookToApi() {
    const api = getApiBase();
    const body = apiBodyFromCanvas();
    setStatusMessage(uiText('savingToServer'), 'info');
    try {
        const url = currentNoteId
            ? `${api}/notes/${encodeURIComponent(currentNoteId)}`
            : `${api}/notes`;
        const method = currentNoteId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const t = await res.text();
            throw new Error(t || res.statusText);
        }
        const doc = await res.json();
        if (doc.id) {
            setCurrentNoteId(doc.id);
            replaceUrlNoteParam(doc.id);
        }
        setStatusMessage(uiText('savedToServer'), 'info');
    } catch (e) {
        setStatusMessage(uiText('saveFailedPrefix') + (e.message || String(e)), 'error');
    }
}

async function loadNotebookFromApiById(noteId) {
    const api = getApiBase();
    setStatusMessage(uiText('loadingFromServer'), 'info');
    try {
        const res = await fetch(`${api}/notes/${encodeURIComponent(noteId)}`);
        if (res.status === 404) {
            setCurrentNoteId(null);
            replaceUrlNoteParam(null);
            setStatusMessage(uiText('noteNotFound'), 'error');
            return;
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        applyImportedData(data);
        const nid = data.id || noteId;
        setCurrentNoteId(nid);
        replaceUrlNoteParam(nid);
        setStatusMessage(uiText('loadedFromServer'), 'info');
    } catch (e) {
        setStatusMessage(uiText('loadFailedPrefix') + (e.message || String(e)), 'error');
    }
}

async function fetchNotesListForDialog() {
    const api = getApiBase();
    const listEl = document.getElementById('apiOpenList');
    const errEl = document.getElementById('apiOpenError');
    if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
    }
    if (!listEl) return;
    listEl.innerHTML = '';
    try {
        const res = await fetch(`${api}/notes`);
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        if (!rows.length) {
            const li = document.createElement('li');
            li.className = 'api-open-list__empty';
            li.textContent = uiText('noNotesYet');
            listEl.appendChild(li);
            return;
        }
        rows.forEach(row => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            const title = (row.heading || uiText('noTitle')).trim() || uiText('noTitle');
            const updated = row.updated_at ? new Date(row.updated_at).toLocaleString() : '';
            btn.type = 'button';
            btn.textContent = title + (updated ? ' — ' + updated : '');
            btn.addEventListener('click', async () => {
                document.getElementById('apiOpenDialog')?.close();
                await loadNotebookFromApiById(row.id);
            });
            li.appendChild(btn);
            listEl.appendChild(li);
        });
    } catch (e) {
        if (errEl) {
            errEl.textContent = e.message || String(e);
            errEl.hidden = false;
        }
    }
}

function openApiNotesDialog() {
    const dlg = document.getElementById('apiOpenDialog');
    if (!dlg) return;
    void fetchNotesListForDialog();
    dlg.showModal();
}

function newBlankNotebook() {
    document.getElementById("headingText").innerText = "";
    resetHeadingStyle();
    document.getElementById("cueText").innerText = "";
    document.getElementById("notesText").innerText = "";
    refreshPlaceholderState(['headingText', 'cueText', 'notesText']);
    document.getElementById("boxes").innerHTML = '';
    document.getElementById("lines").innerHTML = '';
    boxes.clear();
    totalBoxes = 0;
    createNewBlock(0, 20, "New Box", {});
    setCurrentNoteId(null);
    replaceUrlNoteParam(null);
    setStatusMessage(uiText('newNoteUnsaved'), 'info');
}

function initApiIntegration() {
    const baseInput = document.getElementById('api-base-url');
    if (baseInput) {
        baseInput.value = localStorage.getItem(TREENOTES_API_BASE_KEY) || getApiBase();
        baseInput.addEventListener('change', () => {
            const v = baseInput.value.trim();
            if (v) localStorage.setItem(TREENOTES_API_BASE_KEY, v.replace(/\/$/, ''));
            else localStorage.removeItem(TREENOTES_API_BASE_KEY);
            void checkBackendConnection();
        });
    }

    document.getElementById('apiSaveBtn')?.addEventListener('click', () => void saveNotebookToApi());
    document.getElementById('apiOpenBtn')?.addEventListener('click', () => openApiNotesDialog());
    document.getElementById('apiNewBtn')?.addEventListener('click', () => newBlankNotebook());
    document.getElementById('localSaveBtn')?.addEventListener('click', () => download());
    document.getElementById('localOpenBtn')?.addEventListener('click', () => upload());
    document.getElementById('apiOpenRefresh')?.addEventListener('click', () => void fetchNotesListForDialog());
    document.getElementById('apiOpenCancel')?.addEventListener('click', () => {
        document.getElementById('apiOpenDialog')?.close();
    });

    const params = new URLSearchParams(location.search);
    const noteFromUrl = params.get('note');
    if (noteFromUrl && /^[0-9a-f-]{36}$/i.test(noteFromUrl)) {
        void loadNotebookFromApiById(noteFromUrl);
    } else {
        setCurrentNoteId(null);
    }
}

// --------------------------------------------------------------------------
// new additions
// --------------------------------------------------------------------------

 // --------------------------------------------------------------------------
// Download Functionality
// --------------------------------------------------------------------------
function download() {
    const data = collectNotebookPayload();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "treenotes.json";
    a.click();
}

// --------------------------------------------------------------------------
// Upload Functionality
// --------------------------------------------------------------------------
function upload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
            const data = JSON.parse(evt.target.result);
            applyImportedData(data);
            setCurrentNoteId(null);
            replaceUrlNoteParam(null);
            setStatusMessage(uiText('loadedFromFile'), 'info');
        };

        reader.readAsText(file);
    };

    input.click();
}

function toggleDarkMode() {
    const isDarkMode = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDarkMode ? '' : 'dark';
    localStorage.setItem('treenotes-theme', document.documentElement.dataset.theme);
}

(function applySavedTheme() {
    const savedTheme = localStorage.getItem('treenotes-theme');
    if (savedTheme) {
        document.documentElement.dataset.theme = savedTheme;
    }
})();

// --------------------------------------------------------------------------
// placeholders and tree menu
// --------------------------------------------------------------------------  
function syncPlaceholderState(el) {
    if (!el) return;
    const text = el.textContent.replace(/\u00A0/g, ' ').trim();
    const isEmpty = text.length === 0;
    el.classList.toggle('is-empty', isEmpty);
    if (isEmpty && el.innerHTML !== '') {
        el.innerHTML = '';
    }
}

// Call after programmatic innerText changes (e.g. importing JSON, clearing on
// "New") — `input` only fires for real user typing, so without this the
// placeholder ::before keeps rendering on top of the freshly assigned text.
function refreshPlaceholderState(idsOrEls) {
    if (!Array.isArray(idsOrEls)) idsOrEls = [idsOrEls];
    idsOrEls.forEach(item => {
        const el = typeof item === 'string' ? document.getElementById(item) : item;
        syncPlaceholderState(el);
    });
}

function setupEditablePlaceholders() {
    const editables = document.querySelectorAll('[contenteditable][data-placeholder]:not(.box)');
    editables.forEach(el => {
        syncPlaceholderState(el);

        el.addEventListener('focus', () => {
            if (el.classList.contains('is-empty')) {
                el.innerHTML = '';
                el.classList.remove('is-empty');
            }
        });

        el.addEventListener('input', () => syncPlaceholderState(el));
        el.addEventListener('blur', () => syncPlaceholderState(el));
    });
}

function initTreeMenu() {
    const treeContainer = document.querySelector('#tree .container');
    const treeMenu = document.getElementById('treeQuickMenu');

    if (!treeContainer || !treeMenu) return;

    const hideMenu = () => {
        treeMenu.classList.remove('visible');
        treeMenu.setAttribute('aria-hidden', 'true');
    };

    // Right-click anywhere on the empty canvas opens the quick menu — left
    // clicks are reserved for selecting/dragging boxes and editing text.
    treeContainer.addEventListener('contextmenu', event => {
        if (event.target.closest('.box') || event.target.closest('#toolbarBar') || event.target.closest('#treeQuickMenu')) {
            return;
        }
        event.preventDefault();

        const rect = treeContainer.getBoundingClientRect();
        const x = event.clientX - rect.left + treeContainer.scrollLeft;
        const y = event.clientY - rect.top + treeContainer.scrollTop;

        treeMenu.classList.add('visible');
        treeMenu.setAttribute('aria-hidden', 'false');
        treeMenu.style.left = `${x}px`;
        treeMenu.style.top = `${y}px`;

        requestAnimationFrame(() => {
            const menuWidth = treeMenu.offsetWidth;
            const menuHeight = treeMenu.offsetHeight;
            const maxLeft = treeContainer.scrollWidth - menuWidth - 12;
            const maxTop = treeContainer.scrollHeight - menuHeight - 12;
            const nextLeft = Math.max(12, Math.min(x, maxLeft));
            const nextTop = Math.max(12, Math.min(y, maxTop));
            treeMenu.style.left = `${nextLeft}px`;
            treeMenu.style.top = `${nextTop}px`;
        });
    });

    // Dismiss the quick menu on Escape.
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && treeMenu.classList.contains('visible')) {
            hideMenu();
        }
    });

    treeMenu.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;

        event.stopPropagation();
        switch (button.dataset.action) {
            case 'info':
                if (typeof noteInfo === 'function') {
                    noteInfo();
                } else {
                    alert(uiText('comingSoon'));
                }
                break;
            case 'help':
                document.getElementById('helpDialog').showModal();
                break;
            case 'dark':
                toggleDarkMode();
                break;
            default:
                break;
        }

        hideMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideMenu();
        }
    });

    hideMenu();
}

function initResizer() {
    const resizer = document.getElementById('cornell-resizer');
    const leftPanel = document.getElementById('text');
    const rightPanel = document.getElementById('tree');

    if (!resizer || !leftPanel || !rightPanel) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('is-resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const startX = e.clientX;
        const startWidthLeft = leftPanel.offsetWidth;
        const startWidthRight = rightPanel.offsetWidth;

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const isRtl = document.documentElement.dir === 'rtl';
            const deltaX = isRtl ? startX - e.clientX : e.clientX - startX;
            const newWidthLeft = startWidthLeft + deltaX;
            const newWidthRight = startWidthRight - deltaX;
            
            const totalWidth = leftPanel.parentElement.offsetWidth;
            const leftPercentage = (newWidthLeft / totalWidth) * 100;
            const rightPercentage = (newWidthRight / totalWidth) * 100;

            leftPanel.style.flexBasis = `${leftPercentage}%`;
            rightPanel.style.flexBasis = `${rightPercentage}%`;
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            resizer.classList.remove('is-resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEditablePlaceholders();
    setupPlainTextPaste();
    setupDictationTargetTracking();
    initDictationPreferences();
    initGridToggle();
    initTreePanning();
    initTreeMenu();
    initToolbarAssistControls();
    initHeadingColorControls();
    initAiPreferences();
    initUiLanguagePreference();
    initFeedbackControls();
    initResizer();
    initApiIntegration();
    initConnectionStatus();

    // --- GUI Enhancements ---
    // Enforce visibility of status messages and styling of the Cornell canvas
    const guiStyle = document.createElement('style');
    guiStyle.textContent = `
        /* Position status messages prominently just below the top toolbar */
        #statusMessage {
            display: none;
        }
        #statusMessage.is-active {
            display: block !important;
            position: fixed !important;
            top: 70px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 10000 !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            font-weight: 500 !important;
            background-color: #e6f7ff !important;
            color: #0056b3 !important;
            border: 1px solid #bae1ff !important;
        }
        #statusMessage.is-alert {
            background-color: #fff1f0 !important;
            color: #cf1322 !important;
            border: 1px solid #ffa39e !important;
        }
        
        /* Make main Cornell canvas area all white (in light mode) and large enough for many boxes/seeds */
        html:not([data-theme="dark"]) #tree,
        html:not([data-theme="dark"]) #tree .container,
        html:not([data-theme="dark"]) #zoom {
            background-color: #ffffff !important;
        }
        #zoom {
            min-width: 4000px !important;
            min-height: 4000px !important;
        }
    `;
    document.head.appendChild(guiStyle);

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if(fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = 'Exit Fullscreen';
        } else {
            fullscreenBtn.textContent = '⛶';
        }
    });

    const menuIcon = document.getElementById('menuIcon');
    const menuPopup = document.getElementById('menuPopup');

    if (menuIcon && menuPopup) {
        menuIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = menuPopup.style.display === 'none' || !menuPopup.style.display;
            menuPopup.style.display = isHidden ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            menuPopup.style.display = 'none';
        });

        menuPopup.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.getElementById('toggleDarkMode').addEventListener('click', toggleDarkMode);
        document.getElementById('help').addEventListener('click', () => document.getElementById('helpDialog').showModal());
        document.getElementById('about').addEventListener('click', () => document.getElementById('aboutDialog').showModal());
    }
});
