---
title: Notların
description: Flashjot notları nasıl düz Markdown dosyaları olarak saklar, nerededirler, nasıl yedeklenir ya da senkronize edilir.
---

Flashjot'un bir veritabanı yok. Her not, normal bir klasördeki Markdown dosyasıdır; notlarını
herhangi bir araçla okuyabilir, düzenleyebilir, arayabilir, yedekleyebilir ve senkronize
edebilirsin. Flashjot olmasa da okunabilir kalırlar.

## Neredeler

Varsayılan olarak ev klasöründeki `Belgeler/Flashjot` içinde (İngilizce sistemlerde
`Documents/Flashjot`). [Ayarlar](/tr/guide/settings/#not-klasörü)'dan başka bir klasör seçebilirsin.

```text
Belgeler/Flashjot/
├── Inbox/                         hızlı notlar, her biri ayrı dosya
│   └── 2026-10-19-143205.md
├── Fikirler/                      defterde bir klasör
│   ├── Robot kol.md               bir sayfa; dosya adı başlıktır
│   └── Okuma listesi.md
├── İş/
│   └── Haftalık toplantı.md
├── Klasörsüz sayfa.md             klasörü olmayan bir sayfa
└── .trash/                        silinen notlar
```

- Bir **sayfa**, bir `.md` dosyasıdır. Başlığı, `.md` olmadan dosya adıdır.
- Kenar çubuğundaki bir **klasör**, diskte bir klasördür. İç içe klasörler de çalışır.
- `.md` ile bitmeyen dosyalar ve adı nokta ile başlayan klasörler yok sayılır.

## Flashjot dışında düzenlemek

Dosyaları herhangi bir editörle düzenleyebilir ya da Obsidian'ı aynı klasöre yönlendirebilirsin.
Kenar çubuğu klasörü, defter açıldığında ve Flashjot'ta bir not eklediğin, yeniden adlandırdığın,
taşıdığın ya da sildiğin her seferde yeniden okur; başka yerde oluşturulan dosyalar o zaman
görünür. Sen başka yerde düzenlerken Flashjot'ta açık olan bir sayfa henüz kendiliğinden yenilenmez;
başka bir sayfaya geçip geri dön. Klasördeki değişiklikleri izlemek [yol haritasında](/tr/roadmap/).

## Güvenli kayıt

Flashjot her kaydı önce notun yanındaki geçici bir dosyaya yazar, diske işler, sonra eski dosyanın
yerine koyar. Bir çökme ya da elektrik kesintisi ya eski sürümü ya yenisini bırakır, asla yarım
yazılmış bir dosya bırakmaz.

## Silinen notlar

Silmek, dosyayı adına saat eklenerek `.trash/` içine taşır. Hemen ardından **Geri al** onu geri
getirir. Flashjot çöpü asla boşaltmaz; emin olduğunda `.trash/` içindeki dosyaları kendin sil.

## Yedekleme ve senkronizasyon

Notlar düz dosya olduğu için her yedekleme aracı çalışır. Birkaç yaygın kurulum:

- **Git:** not klasöründe `git init` çalıştır ve arada bir commit at. Silinen notların geçmişte
  olmasını istemiyorsan `.trash/`'i `.gitignore`'a ekle.
- **Syncthing, Dropbox, OneDrive, iCloud Drive:** Ayarlar'da not klasörü olarak senkronize edilen
  bir klasör seç.

Senkronize bir klasörü aynı anda tek bilgisayarda kullan. Flashjot iki makinede aynı anda yapılan
düzenlemeleri birleştirmez.
