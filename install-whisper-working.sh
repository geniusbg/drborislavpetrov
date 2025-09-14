#!/bin/bash

echo "🚀 Installing Whisper STT - Тествано работещо решение"
echo "====================================================="

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required system packages
echo "🐍 Installing Python and dependencies..."
sudo apt install -y python3 python3-pip python3-venv ffmpeg espeak

# 3. Install specific PyTorch CPU versions
echo "🔥 Installing PyTorch 2.1.2+cpu (tested and working)..."
pip install torch==2.1.2+cpu torchvision==0.16.2+cpu torchaudio==2.1.2+cpu --index-url https://download.pytorch.org/whl/cpu

# 4. Fix NumPy version
echo "🔢 Fixing NumPy version..."
pip uninstall numpy -y
pip install "numpy<2"

# 5. Install Whisper
echo "🎤 Installing OpenAI Whisper..."
pip install openai-whisper

# 6. Test installation
echo "🧪 Testing installation..."
python3 -c "import torch; print('✅ PyTorch:', torch.__version__)"
python3 -c "import numpy; print('✅ NumPy:', numpy.__version__)"
whisper --version

# 7. Create test audio and run Whisper
echo "🎵 Creating test audio..."
echo "Здравей, това е тест за Whisper STT" | espeak -s 120 -w /tmp/whisper_test.wav

echo "🎤 Testing Whisper with working command..."
whisper /tmp/whisper_test.wav --model tiny --device cpu --fp16 False --language bg

# 8. Check results
if [ -f "/tmp/whisper_test.wav.txt" ]; then
    echo "✅ SUCCESS! Whisper is working correctly!"
    echo "📝 Transcription result:"
    cat /tmp/whisper_test.wav.txt
    echo ""
    
    # Update .env file if it exists (in project directory)
    PROJECT_DIR="/var/www/html/drpetrov"
    if [ -f "$PROJECT_DIR/.env" ]; then
        echo "📝 Updating .env file in $PROJECT_DIR..."
        cd "$PROJECT_DIR"
        sed -i '/WHISPER_/d' .env
        sed -i '/CUDA_/d' .env
        sed -i '/OMP_/d' .env
        
        echo "WHISPER_MODEL=tiny" >> .env
        echo "WHISPER_CLI=whisper" >> .env
        echo "CUDA_VISIBLE_DEVICES=\"\"" >> .env
        echo "OMP_NUM_THREADS=4" >> .env
        
        echo "✅ .env file updated in project directory"
    else
        echo "⚠️ .env file not found. Please update manually in your project directory."
    fi
    
else
    echo "❌ Test failed. Check the installation steps."
fi

# 9. Cleanup all Whisper generated files
echo "🧹 Cleaning up test files..."
rm -f /tmp/whisper_test.wav*

echo ""
echo "🎯 Working command for reference:"
echo "whisper [file] --model tiny --device cpu --fp16 False --language bg"
echo ""
echo "📋 Key versions installed:"
echo "- PyTorch: 2.1.2+cpu"
echo "- NumPy: <2.0"
echo "- Whisper: latest"
echo ""
echo "✅ Installation completed!"
