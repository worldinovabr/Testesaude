path = 'client/src/components/tests/HearingTest.tsx'
with open(path, 'rb') as f:
    raw = f.read()

bom = b''
if raw[:3] == b'\xef\xbb\xbf':
    bom = b'\xef\xbb\xbf'
    raw = raw[3:]

# The file went through: original UTF-8 -> PowerShell read as CP1252 -> wrote as UTF-8
# Fix: decode current UTF-8 text, encode back to CP1252 bytes, decode those as UTF-8
text = raw.decode('utf-8')

# Encode char by char back to CP1252, using the WINDOWS-1252 table for chars in 0x80-0x9F range
# Python's 'cp1252' handles the 0x80-0x9F range correctly
try:
    fixed_bytes = text.encode('cp1252')
    fixed = fixed_bytes.decode('utf-8')
except Exception:
    # Fallback: do char-by-char, replacing undefined cp1252 positions
    import io
    fixed_bytes = io.BytesIO()
    for ch in text:
        try:
            fixed_bytes.write(ch.encode('cp1252'))
        except (UnicodeEncodeError, UnicodeDecodeError):
            fixed_bytes.write(ch.encode('utf-8'))
    fixed_raw = fixed_bytes.getvalue()
    # Now decode as UTF-8, replacing bad sequences
    fixed = fixed_raw.decode('utf-8', errors='replace')

with open(path, 'wb') as f:
    f.write(bom + fixed.encode('utf-8'))

# Quick sanity check
with open(path, encoding='utf-8') as f:
    t = f.read()
print('Audição found:', 'Audição' in t)
print('Frequência found:', 'Frequência' in t)
print('▶ found:', '▶' in t)
print('✓ found:', '✓' in t or '✔' in t)
print('Done')
