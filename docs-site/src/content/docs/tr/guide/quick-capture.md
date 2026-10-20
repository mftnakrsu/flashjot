---
title: Hızlı not
description: Hızlı kutuyu global bir kısayolla aç, bir düşünceyi yaz, Gelen kutusuna kaydet ve işine dön.
---

Hızlı kutu, Flashjot'un en çok kullanacağın parçası. Tek bir iş için yapıldı: elindeki işi
bırakmadan, birkaç saniyede bir düşünceyi kafandan çıkarıp kaydetmek.

<img
  class="shot"
  src="/screenshots/quick-tr.png"
  alt="Masaüstünün üstünde hızlı kutu: Flashjot başlığı, kırmızı bir çizgi ve bir satır yazı; altta Enter, Shift+Enter ve Esc tuşları"
  width="1600"
  height="900"
  loading="lazy"
/>

## Bir düşünceyi yakala

1. Herhangi bir uygulamadayken <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>'ye bas (macOS'ta
   <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>N</kbd>). Kutu, farenin olduğu ekranın üst üçte birinde açılır;
   imleç zaten yazı alanındadır.
2. Yaz. Düşünce bir satıra sığmıyorsa <kbd>Shift</kbd>+<kbd>Enter</kbd> yeni satır açar.
3. <kbd>Enter</kbd>'a bas. Kırmızı çizgi yeşile döner, bir an **Gelen kutusuna kaydedildi** yazar
   ve kutu kapanır.

Not artık notlarının `Inbox` klasöründe, kaydettiğin saatin adını taşıyan bir dosyadır; örneğin
`Inbox/2026-10-19-143205.md`. Defterdeki [Gelen kutusunda](/tr/guide/notebook/#gelen-kutusu) hemen
görünür.

## Görevler

Not yerine görev eklemek için metne `[]` (ya da `[ ]`) ile başla ve Enter'a bas. Her satır bir
görev olur: `[] süt`, Shift+Enter, `ekmek` iki görev ekler. Görevler not klasörünün en üstündeki
**Görevler** sayfasına sıradan Markdown kutucukları olarak eklenir (`- [ ] süt`). Sayfa ilk
görevle oluşturulur. Adını değiştirir ya da taşırsan Flashjot yeni bir sayfa açar.

## Kaydetmeden kapat

<kbd>Esc</kbd>'ye bas, kısayola tekrar bas ya da kutunun dışına tıkla. Kutu kapanır ama **yazdığın
durur**: kutuyu bir sonraki açışında taslak yerindedir, yeniden başlatmadan sonra bile. Bir taslaktan
kurtulmak için seçip sil.

Boş bir kutu asla not oluşturmaz.

## Kaydedilemezse

Not yazılamazsa (örneğin not klasörü çıkarılmış bir diskteyse) kutu açık kalır, **Kaydedilemedi.
Yazdığın burada duruyor.** mesajını gösterir ve yazını korur. [Ayarlar](/tr/guide/settings/#not-klasörü)'dan
klasörü düzelt ve tekrar <kbd>Enter</kbd>'a bas.

## Deftere geç

Kutunun sağ üstündeki **Defter** düğmesi ya da <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> defteri
açar.

## Kısayol çalışmıyor mu?

- **Başka bir uygulama aynı tuşları kullanıyor.** [Ayarlar](/tr/guide/settings/#kısayollar)'dan
  başka bir kombinasyon seç. Bir kısayol kaydedilemezse Flashjot bunu orada söyler.
- **Linux'ta Wayland.** Wayland, uygulamaların global kısayol kaydetmesine henüz izin vermiyor.
  Masaüstünün klavye ayarlarından `flashjot --quick` komutuna bir tuş ata; bkz.
  [Linux](/tr/install/linux/#wayland).
- **Flashjot çalışmıyor.** Uygulama menüsünden bir kez başlat. Tepside çalışmaya devam eder;
  **Oturum açtığımda Flashjot'u başlat** açıksa kendiliğinden başlar.
