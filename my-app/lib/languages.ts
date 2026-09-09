export const languages = [
  { code: 'ko', name: '한국어' }, { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' }, { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' }, { code: 'pl', name: 'Polski' },
  { code: 'ja', name: '日本語' }, { code: 'zh', name: '中文' },
];
export const languageName = (code: string) => languages.find((language) => language.code === code)?.name ?? code;
export function preferredLanguage() {
  let saved = '';
  try { saved = localStorage.getItem('wyd_language') ?? ''; } catch {}
  const code = saved || navigator.language.split('-')[0];
  return languages.some((language) => language.code === code) ? code : 'en';
}
export function saveLanguage(code: string) {
  if (!languages.some((language) => language.code === code)) return;
  try { localStorage.setItem('wyd_language', code); } catch {}
  document.documentElement.lang = code;
  window.dispatchEvent(new Event('wyd-language'));
}

const readerLabels: Record<string, string[]> = {
  ko: ['전달받은 메시지', '내 언어', '원문', '번역 중이에요…', '지금은 번역할 수 없어 원문을 표시했어요.', '다시 번역', '홈으로', '메시지 링크를 확인해주세요', '링크가 불완전하거나 올바르지 않아요. 보낸 사람에게 다시 요청해주세요.', '새 메시지 만들기', '자동 번역 · 중요한 내용은 원문도 확인하세요.', '메시지를 여는 중…', '보낸 이름'],
  en: ['A message for you', 'My language', 'Original', 'Translating…', 'Translation is unavailable. The original is shown.', 'Try again', 'Home', 'Check this message link', 'The link is incomplete or invalid. Ask the sender for a new one.', 'Write a message', 'Machine translation · Check the original for important details.', 'Opening your message…', 'Sender name'],
  es: ['Un mensaje para ti', 'Mi idioma', 'Original', 'Traduciendo…', 'La traducción no está disponible. Se muestra el original.', 'Reintentar', 'Inicio', 'Revisa el enlace', 'El enlace está incompleto o no es válido. Pide uno nuevo al remitente.', 'Escribir un mensaje', 'Traducción automática · Revisa el original para los detalles importantes.', 'Abriendo el mensaje…', 'Nombre del remitente'],
  fr: ['Un message pour vous', 'Ma langue', 'Original', 'Traduction en cours…', 'Traduction indisponible. Le texte original est affiché.', 'Réessayer', 'Accueil', 'Vérifiez le lien', 'Le lien est incomplet ou invalide. Demandez un nouveau lien.', 'Écrire un message', 'Traduction automatique · Vérifiez les détails importants dans le texte original.', 'Ouverture du message…', 'Nom de l’expéditeur'],
  it: ['Un messaggio per te', 'La mia lingua', 'Originale', 'Traduzione in corso…', 'Traduzione non disponibile. È mostrato il testo originale.', 'Riprova', 'Home', 'Controlla il link', 'Il link è incompleto o non valido. Chiedi un nuovo link al mittente.', 'Scrivi un messaggio', 'Traduzione automatica · Controlla i dettagli importanti nel testo originale.', 'Apertura del messaggio…', 'Nome del mittente'],
  pt: ['Uma mensagem para você', 'Meu idioma', 'Original', 'Traduzindo…', 'Tradução indisponível. O texto original está sendo exibido.', 'Tentar novamente', 'Início', 'Verifique o link', 'O link está incompleto ou é inválido. Peça um novo link ao remetente.', 'Escrever uma mensagem', 'Tradução automática · Confira os detalhes importantes no texto original.', 'Abrindo a mensagem…', 'Nome do remetente'],
  de: ['Eine Nachricht für dich', 'Meine Sprache', 'Original', 'Wird übersetzt…', 'Übersetzung nicht verfügbar. Das Original wird angezeigt.', 'Erneut versuchen', 'Startseite', 'Prüfe den Nachrichtenlink', 'Der Link ist unvollständig oder ungültig. Bitte um einen neuen Link.', 'Nachricht schreiben', 'Automatische Übersetzung · Prüfe wichtige Angaben im Original.', 'Nachricht wird geöffnet…', 'Absendername'],
  pl: ['Wiadomość dla Ciebie', 'Mój język', 'Oryginał', 'Tłumaczenie…', 'Tłumaczenie jest niedostępne. Wyświetlono oryginał.', 'Spróbuj ponownie', 'Strona główna', 'Sprawdź link', 'Link jest niekompletny lub nieprawidłowy. Poproś nadawcę o nowy.', 'Napisz wiadomość', 'Tłumaczenie automatyczne · Sprawdź ważne szczegóły w oryginale.', 'Otwieranie wiadomości…', 'Nazwa nadawcy'],
  ja: ['あなたへのメッセージ', '表示言語', '原文', '翻訳しています…', '翻訳できないため、原文を表示しています。', 'もう一度翻訳', 'ホーム', 'リンクを確認してください', 'リンクが不完全か無効です。送信者に再送をお願いしてください。', 'メッセージを作成', '自動翻訳 · 重要な内容は原文も確認してください。', 'メッセージを開いています…', '送信者名'],
  zh: ['给你的消息', '我的语言', '原文', '正在翻译…', '暂时无法翻译，已显示原文。', '重试', '首页', '请检查消息链接', '链接不完整或无效，请让发送者重新发送。', '写消息', '自动翻译 · 重要内容请核对原文。', '正在打开消息…', '发送者名称'],
};
export function readerCopy(language: string) {
  const labels = readerLabels[language] ?? readerLabels.en;
  const [title, languageLabel, original, loading, error, retry, home, invalidTitle, invalidBody, compose, notice, opening, sender] = labels;
  return { title, languageLabel, original, loading, error, retry, home, invalidTitle, invalidBody, compose, notice, opening, sender };
}
