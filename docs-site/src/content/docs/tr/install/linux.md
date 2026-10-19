---
title: Linux
description: Flashjot'u Ubuntu, Debian, Pardus, Mint, Fedora ya da herhangi bir dağıtıma kur ve Wayland'de kısayolları ayarla.
---

Dağıtımına uygun dosyayı [son sürümden](https://github.com/mftnakrsu/flashjot/releases/latest)
indir. Bütün paketler 64 bit Intel ve AMD işlemciler içindir (`x86_64`, `amd64`).

## Ubuntu, Debian, Pardus, Linux Mint

`Flashjot_x.y.z_amd64.deb` dosyasını indir ve şununla kur:

```bash
sudo apt install ./Flashjot_*_amd64.deb
```

`apt`, Flashjot'un ihtiyaç duyduğu birkaç kütüphaneyi (WebKitGTK ve tepsi kütüphanesi) eksikse
kendisi kurar. Ubuntu 22.04 ve sonrası, Debian 12 ve sonrası, Pardus 23 ve sonrası ve Linux Mint 21
ve sonrasında çalışır.

## Fedora, openSUSE

`Flashjot-x.y.z-1.x86_64.rpm` dosyasını indir ve şununla kur:

```bash
sudo dnf install ./Flashjot-*.x86_64.rpm      # Fedora
sudo zypper install ./Flashjot-*.x86_64.rpm   # openSUSE
```

## Diğer her dağıtım: AppImage

`Flashjot_x.y.z_amd64.AppImage` dosyasını indir, çalıştırılabilir yap ve başlat:

```bash
chmod +x Flashjot_*_amd64.AppImage
./Flashjot_*_amd64.AppImage
```

AppImage kendi kütüphanelerini taşır, bu yüzden daha büyüktür. Açılmaz ve FUSE'dan söz ederse
`libfuse2` paketini kur (Ubuntu 24.04'te `libfuse2t64`).

## İlk açılış

Uygulama menüsünden **Flashjot**'u başlat. Defter açılır ve tepside bir Flashjot simgesi belirir.
Bundan sonra Flashjot her oturum açışında tepside başlar (bunu [Ayarlar](/tr/guide/settings/)'dan
kapatabilirsin). [Hızlı kutuyu](/tr/guide/quick-capture/) denemek için
<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>'ye bas.

:::note[GNOME'da tepsi simgesi yok mu?]
GNOME, AppIndicator eklentisi açık değilse tepsi simgelerini gizler. Ubuntu'da açık gelir. Diğer
dağıtımlarda [extensions.gnome.org](https://extensions.gnome.org/extension/615/appindicator-support/)
adresinden **AppIndicator and KStatusNotifierItem Support** eklentisini kur. Flashjot simge olmadan
da çalışır; kısayollar pencerelerini açar.
:::

## Wayland

X11'de, KDE Plasma'nın X11 oturumunda, XFCE'de, Cinnamon'da ve MATE'de
global kısayollar kurulur kurulmaz çalışır. Yeni GNOME ve KDE sürümlerinde varsayılan olan Wayland
oturumları ise uygulamaların global kısayol kaydetmesine henüz izin vermiyor. Bunun yerine iki
kısayolu masaüstünün ayarlarından ekle. Flashjot çalışmıyorsa başlatırlar, çalışıyorsa onu
kullanırlar; hızlı kutu yine anında açılır.

| Ad | Komut | Önerilen tuşlar |
|---|---|---|
| Flashjot hızlı not | `flashjot --quick` | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> |
| Flashjot defter | `flashjot --notebook` | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> |

- **GNOME:** Ayarlar → Klavye → Kısayolları Görüntüle ve Özelleştir → Özel Kısayollar → **+**.
- **KDE Plasma:** Sistem Ayarları → Klavye → Kısayollar → Yeni Ekle → Komut ya da Betik.

AppImage kurduysan `flashjot` yerine dosyanın tam yolunu kullan; örneğin
`/home/sen/Uygulamalar/Flashjot_0.1.1_amd64.AppImage --quick`.

Hangi oturumda olduğunu görmek için `echo $XDG_SESSION_TYPE` çalıştır.

## Kaldırma

```bash
sudo apt remove flashjot     # .deb
sudo dnf remove flashjot     # .rpm
```

AppImage için dosyayı sil. `Belgeler/Flashjot` içindeki notların yerinde kalır.
