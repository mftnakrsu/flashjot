---
title: macOS
description: Flashjot'u Apple Silicon ya da Intel işlemcili bir Mac'e kur.
---

## Kurulum

1. Mac'ine uygun disk görüntüsünü [son sürümden](https://github.com/mftnakrsu/flashjot/releases/latest)
   indir:
   - Apple Silicon (M1 ve sonrası) için `Flashjot_x.y.z_aarch64.dmg`
   - Intel Mac'ler için `Flashjot_x.y.z_x64.dmg`

   Hangisi olduğundan emin değil misin? Apple menüsü → **Bu Mac Hakkında**: “Çip” yazıyorsa Apple
   Silicon, “İşlemci” yazıyorsa Intel.
2. Disk görüntüsünü aç ve **Flashjot**'u **Uygulamalar** klasörüne sürükle.

## İlk açılış

Flashjot henüz Apple tarafından onaylanmadığı (notarize edilmediği) için macOS ilk açılışı engeller:

1. Flashjot'u Uygulamalar'dan aç. macOS uygulamayı denetleyemediğini söyler; **Bitti**'yi seç.
2. Sistem Ayarları → **Gizlilik ve Güvenlik**'i aç, aşağı kaydırıp Flashjot ile ilgili mesajı bul,
   **Yine de Aç**'ı seç ve onayla.

Bundan sonra normal açılır. Terminal'i tercih edersen bu da aynı işi yapar:

```bash
xattr -dr com.apple.quarantine /Applications/Flashjot.app
```

Flashjot, Dock yerine menü çubuğunda durur. [Hızlı kutuyu](/tr/guide/quick-capture/) denemek için
<kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>N</kbd>'ye, defter için <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>D</kbd>'ye bas.

## Kaldırma

Menü çubuğu simgesinden Flashjot'tan çık ve onu Uygulamalar'dan Çöp Sepeti'ne taşı. `Belgeler/Flashjot`
içindeki notların yerinde kalır.
