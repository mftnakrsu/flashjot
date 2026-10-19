---
title: Ayarlar
description: Global kısayolları, not klasörünü, dili ve Flashjot'un oturum açınca başlayıp başlamayacağını değiştir.
---

Ayarları defter kenar çubuğunun altındaki dişli simgesiyle, <kbd>Ctrl</kbd>+<kbd>,</kbd> ile ya da
tepsi menüsünden aç. Değişiklikler **Kaydet**'i seçince uygulanır.

## Kısayollar

Değiştirmek istediğin kısayola tıkla, sonra yeni kombinasyona bas. Bir harf, rakam, işlev tuşu ya da
noktalama tuşunun yanında en az bir <kbd>Ctrl</kbd>, <kbd>Alt</kbd> ya da <kbd>⌘</kbd> olmalı.
<kbd>Esc</kbd> vazgeçer.

Kaydettiğinde Flashjot eski kısayolları bırakır ve yenilerini kaydeder. Bir kombinasyonu başka bir
uygulama zaten kullanıyorsa, ayarlar sayfası onu **Bazı ayarlar uygulanamadı** altında listeler;
başka bir tane seçebilirsin.

## Not klasörü

Varsayılanı, yani ev klasöründeki `Belgeler/Flashjot`'u kullanmak için alanı boş bırak. Notlarını
başka bir yerde tutmak için bir yol yaz; örneğin Syncthing, Dropbox ya da OneDrive'ın senkronize
ettiği bir klasör. **Dosya yöneticisinde göster** mevcut klasörü açar.

Klasörü değiştirdiğinde Flashjot mevcut notlarını taşımaz. Yeni yerde olmalarını istiyorsan kendin
kopyala.

Klasör oluşturulamıyorsa Flashjot bunu söyler ve ayarları kaydetmez. Flashjot açılırken klasör
kullanılamıyorsa (örneğin takılı olmayan bir disk), klasör geri gelene kadar varsayılanı kullanır.

## Dil

**Otomatik** sistem dilini izler. Türkçe ve İngilizce var; başka bir dil eklemek için bkz.
[Katkıda bulunmak](/tr/development/contributing/#add-a-language).

## Oturum açtığımda Flashjot'u başlat

Varsayılan olarak açık; böylece oturum açar açmaz kısayollar çalışır. Flashjot pencere açmadan
tepside başlar.

## Ayarlar nerede saklanır

Ayarlar, uygulamanın yapılandırma klasöründe küçük bir JSON dosyasıdır (`settings.json`):

| Sistem | Klasör |
|---|---|
| Linux | `~/.config/io.github.mftnakrsu.flashjot/` |
| Windows | `%APPDATA%\io.github.mftnakrsu.flashjot\` |
| macOS | `~/Library/Application Support/io.github.mftnakrsu.flashjot/` |

Dosya bozulursa Flashjot varsayılanlarla başlar ve eski dosyayı `settings.json.bak` olarak saklar.
