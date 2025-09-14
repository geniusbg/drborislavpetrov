#!/bin/bash

# Production Whisper Setup Script for Ubuntu
# Изпълнете като: sudo bash setup-whisper-production.sh

echo "🚀 Setting up Whisper for production..."

# 1. Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install Python and pip
echo "🐍 Installing Python and pip..."
apt install python3 python3-pip python3-venv -y

# 3. Install ffmpeg (required for audio processing)
echo "🎵 Installing ffmpeg..."
apt install ffmpeg -y

# 4. Install CPU-only PyTorch first
echo "🐍 Installing CPU-only PyTorch..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 5. Install Whisper
echo "🎤 Installing Whisper..."
pip3 install -U openai-whisper

# 6. Create temp directory for Whisper
echo "📁 Creating temp directory..."
mkdir -p /var/tmp/whisper
chown -R www-data:www-data /var/tmp/whisper
chmod -R 755 /var/tmp/whisper

# 7. Test Whisper installation
echo "🧪 Testing Whisper installation..."
whisper --version

# 8. Create test audio file
echo "🎵 Creating test audio file..."
echo "Здравей, това е тест за Whisper" | espeak -s 120 -w /tmp/test.wav

# 9. Test Whisper with Bulgarian
echo "🇧🇬 Testing Whisper with Bulgarian..."
whisper /tmp/test.wav --model small --language bg --output_format txt

# 10. Show results
echo "📝 Test results:"
cat /tmp/test.wav.txt

# 11. Cleanup test files
rm -f /tmp/test.wav /tmp/test.wav.txt

echo "✅ Whisper setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add to your .env file:"
echo "   WHISPER_MODEL=small"
echo "   WHISPER_CLI=whisper"
echo "   TEMP_DIR=/var/tmp/whisper"
echo ""
echo "2. Restart your application"
echo "3. Test STT API with: curl -X POST https://drpetrov.bg/api/stt -H 'Content-Type: audio/wav' --data-binary @test.wav"
