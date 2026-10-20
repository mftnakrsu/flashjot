---
title: Defter
description: Gelen kutusundaki hızlı notları klasörlere ayır, Markdown ile sayfa yaz ve her şeyde ara.
---

Defter, vaktin olduğunda notlarının durduğu yer. <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> ile
(macOS'ta <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>D</kbd>), tepsi menüsünden ya da Flashjot'u uygulama
menüsünden başlatarak açabilirsin. Pencereyi kapatmak onu yalnızca gizler; Flashjot tepside
çalışmaya devam eder.

<img
  class="shot"
  src="/screenshots/page-tr.png"
  alt="Kenar çubuğunda Fikirler ve İş klasörleri olan defter; açık olan Robot kol sayfasında başlıklar, kutucuklar ve bir kod bloğu"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Gelen kutusu

Hızlı kutudan kaydettiğin her not, en yenisi üstte olmak üzere **Gelen** kutusuna düşer. Kenar
çubuğundaki kırmızı sayı kaç notun beklediğini gösterir. Her not, yazıldığı saati gösteren bir
karttır.

<img
  class="shot"
  src="/screenshots/inbox-tr.png"
  alt="Üç hızlı notun kart olarak göründüğü Gelen kutusu; her kartın üstünde kırmızı bir çizgi ve saat var"
  width="2160"
  height="1350"
  loading="lazy"
/>

Bir karta tıkla ya da kartlar arasında <kbd>↑</kbd> ve <kbd>↓</kbd> ile gez, sonra:

| Tuş | Ne yapar |
|---|---|
| <kbd>Enter</kbd> | Notu editörde açar |
| <kbd>M</kbd> | Bir klasöre taşır |
| <kbd>Del</kbd> | Siler (geri alabilirsin) |

Aynı işler, fareyle bir kartın üstüne gelince düğme olarak da görünür.

### Bir notu klasöre taşı

<kbd>M</kbd>'ye bas ya da **Taşı…**'yı seç. Listeyi süzmek için bir klasör adı yazmaya başla, sonra
<kbd>Enter</kbd>'a bas ya da bir klasöre tıkla. Eşleşen klasör yoksa **Yeni klasör…** onu oluşturur.
**Klasörsüz** notu en üst düzeye koyar.

<img
  class="shot"
  src="/screenshots/move-tr.png"
  alt="Gelen kutusunun üstünde Taşı diyaloğu: “Fik” yazılmış; seçenekler Fikirler, Yeni klasör “Fik” ve Klasörsüz"
  width="2160"
  height="1350"
  loading="lazy"
/>

Gelen kutusundan çıkan bir hızlı not, ilk satırından okunabilir bir ad alır. “Omuz eklemi için kayış
tahrik dene” notu `Fikirler/Omuz eklemi için kayış tahrik dene.md` olur; baştaki `#` ya da `- [ ]`
gibi Markdown işaretleri atılır.

## Açık görevler

Kenar çubuğundaki **Açık görevler**, tüm notlarındaki işaretlenmemiş görevleri (`- [ ]`) sayfalara
göre gruplu listeler; Görevler sayfası en üsttedir. Bir görevi işaretleyince dosyasında da
tamamlanır; görünümden çıkana kadar üstü çizili olarak listede kalır, ikinci tıklama geri alır.
Bir göreve ya da sayfa adına tıklayınca sayfa açılır. Kod bloklarının içindeki görevler sayılmaz.

## Sayfalar ve klasörler

- **Yeni sayfa:** <kbd>Ctrl</kbd>+<kbd>N</kbd>, **Yeni sayfa** düğmesi ya da bir klasörün yanındaki
  sayfa simgesi. Sayfa, açık olan sayfanın yanında oluşturulur ve başlığı seçili gelir; üstüne
  yazabilirsin. Metne geçmek için <kbd>Enter</kbd>'a bas.
- **Yeniden adlandır:** sayfanın üstündeki başlığa tıklayıp yaz. Dosya, <kbd>Enter</kbd>'a basınca
  ya da başka yere tıklayınca yeniden adlandırılır.
- **Yeni klasör:** kenar çubuğunun altındaki klasör simgesi.
- **Taşı:** sayfanın sağ üstündeki klasör simgesi ya da <kbd>Ctrl</kbd>+<kbd>M</kbd>.
- **Sil:** sayfadaki ya da kenar çubuğunda yanındaki çöp kutusu simgesi, veya kenar çubuğunda seçili
  sayfada <kbd>Del</kbd>. Silinen notlar `.trash` klasörüne gider; alttaki mesajdaki **Geri al**
  onları geri getirir.

## Yazmak

Sayfalar Markdown'dır. Markdown'ı yazarken görürsün ve yazdıkça biçimlenir:

| Yazdığın | Gördüğün |
|---|---|
| `# Başlık`, `## Başlık` | Daha büyük, kalın başlıklar |
| `**kalın**`, `*italik*` | Kalın ve italik yazı |
| `- madde` | Bir liste; <kbd>Enter</kbd> devam ettirir |
| `- [ ] görev` | Tıklanabilir bir kutucuk; `- [x]` olur |
| `` `kod` `` ve ```` ``` ```` blokları | Yaygın diller için renklendirilmiş kod |

Kaydet düğmesi yok. Değişiklikler, yazmayı bıraktıktan yarım saniye sonra, sayfa değiştirdiğinde ve
pencere odağı kaybettiğinde diske yazılır. Sayfanın sağ üstünde **Kaydedildi** ya da
**Kaydediliyor…** yazar.

## Arama

<kbd>Ctrl</kbd>+<kbd>K</kbd>'ye bas ve yaz. Sen yazarken sonuçlar klasör listesinin yerini alır;
hem başlıklarda hem metinde, Gelen kutusundaki notlar dahil arar. <kbd>Enter</kbd> ilk sonucu açar,
<kbd>↓</kbd> listeye geçer, <kbd>Esc</kbd> aramayı temizler.

<img
  class="shot"
  src="/screenshots/search-tr.png"
  alt="Kenar çubuğunda “tork” araması; sonuç Robot kol ve altında eşleşen satır"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Açık ve koyu

Defter, sisteminin açık ya da koyu ayarını izler.

<img
  class="shot"
  src="/screenshots/page-dark-tr.png"
  alt="Koyu modda defter, Robot kol sayfası açık"
  width="2160"
  height="1350"
  loading="lazy"
/>
