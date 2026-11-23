---
title: Yapay zekâ ajanlarıyla kullanım
description: Claude Code, Claude Desktop, Cursor ve diğer MCP istemcilerinin Flashjot notlarını yakalamasına, okumasına ve düzenlemesine izin verin.
---

Flashjot, bir [MCP](https://modelcontextprotocol.io) sunucusu olan `flashjot-mcp` ile gelir. Bu
sayede bir yapay zekâ ajanı Gelen Kutusu'na hızlı not kaydedebilir, görev ekleyebilir, notlarında
arama yapıp okuyabilir, görevleri işaretleyebilir ve sayfaları taşıyıp yeniden adlandırabilir ya da
çöpe atabilir. Hepsini uygulamayla aynı kurallarla yapar.

- Flashjot açık olsa da olmasa da çalışır. Açıksa değişiklikler bir saniye içinde görünür.
- Çöpü boşaltamaz. Çöpe attığı sayfalar orada kalır ve diğerleri gibi 30 gün sonra kalıcı olarak
  silinir.
- Ayarlarını hiç değiştirmez.
- `write-note` bir sayfanın metnini değiştirir; sayfa, ajan okuduktan sonra diskte değiştiyse bunu
  reddeder. O sırada Flashjot'ta o sayfada kaydedilmemiş yazın varsa, yazdıkların Gelen Kutusu'nda
  yeni bir not olarak saklanır.

## Sunucu nerede

| Kurduğun | Yol |
|---|---|
| `.deb` ya da `.rpm` | `/usr/bin/flashjot-mcp` |
| macOS uygulaması | `/Applications/Flashjot.app/Contents/MacOS/flashjot-mcp` |
| Windows (`.exe` kurulumu) | `%LOCALAPPDATA%\Flashjot\flashjot-mcp.exe` |
| Windows (`.msi`) | `C:\Program Files\Flashjot\flashjot-mcp.exe` |
| AppImage ya da uygulama yok | [son sürümden](https://github.com/mftnakrsu/flashjot/releases/latest) sistemine uygun `flashjot-mcp-…` dosyasını indirip aç |

macOS'ta önce Flashjot'u bir kez aç ki sistem programlarının çalışmasına izin versin. Sunucuyu tek
başına indirdiysen, açtığın klasörde ona bir kez izin ver:

```bash
xattr -d com.apple.quarantine flashjot-mcp
```

## Claude Code

```bash
claude mcp add flashjot -- /usr/bin/flashjot-mcp
```

Tablodaki, sistemine uygun yolu kullan.

## Claude Desktop, Cursor ve diğer istemciler

Bunu istemcinin MCP ayarlarına ekle (Claude Desktop için: Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "flashjot": { "command": "/usr/bin/flashjot-mcp" }
  }
}
```

Windows'ta tam yolu, her `\` işaretini iki kez yazarak gir. `%LOCALAPPDATA%` JSON içinde açılmaz,
bu yüzden kendi kullanıcı klasörünü yaz:

```json
{
  "mcpServers": {
    "flashjot": { "command": "C:\\Users\\<kullanıcı-adın>\\AppData\\Local\\Flashjot\\flashjot-mcp.exe" }
  }
}
```

## Seçenekler

- `--notes-dir <klasör>`: başka bir not klasörü kullanır, örneğin bir Obsidian kasası.
- `--settings <dosya>`: ayarları başka bir dosyadan okur.

Seçeneksiz çalışınca sunucu, Flashjot Ayarları'nda seçili not klasörünü kullanır. O klasörü
değiştirirsen sunucuyu yeniden başlat (çoğu istemcide: istemciyi yeniden başlat).

`--notes-dir` verip `--settings` vermezsen sunucu Flashjot'un ayarlarını okumaz: uygulamanın dili
ve Görevler sayfası kullanılmaz, yeni bir Görevler sayfası sisteminin diliyle adlandırılır.

## Ajan neler yapabilir

| Araç | Ne yapar |
|---|---|
| `capture` | Hızlı notları Gelen Kutusu'na kaydeder; `[]` ile başlayan not, Görevler sayfasına görev ekler |
| `list-inbox`, `list-notebook` | Gelen Kutusu'nu ya da tüm klasör ve sayfaları listeler |
| `read-note`, `search` | Bir sayfayı okur; başlıklarda ve metinde arar |
| `open-tasks`, `set-task` | İşaretlenmemiş görevleri listeler; birini işaretler ya da işaretini kaldırır |
| `write-note` | Bir sayfanın metnini değiştirir; yalnızca ajan okuduktan sonra sen değiştirmediysen |
| `create-folder`, `create-page`, `rename-note`, `move-note` | Sayfaları düzenler |
| `trash-note`, `restore-note` | Bir sayfayı çöpe atar ya da geri getirir |
