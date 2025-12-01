import { ConnectionState } from '../types';

export class DIDService {
  private peerConnection: RTCPeerConnection | null = null;
  private streamId: string | null = null;
  private chatId: string | null = null;
  private videoElement: HTMLVideoElement;
  private onStateChange: (state: ConnectionState) => void;
  private apiKey: string;
  private agentId: string;

  constructor(
    videoElement: HTMLVideoElement, 
    apiKey: string, 
    agentId: string,
    onStateChange: (state: ConnectionState) => void
  ) {
    this.videoElement = videoElement;
    this.apiKey = apiKey;
    this.agentId = agentId;
    this.onStateChange = onStateChange;
  }

  private getAuthHeaders() {
    return {
      Authorization: `Basic ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async connect() {
    try {
      this.onStateChange(ConnectionState.CONNECTING);

      // 1. Initialize RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun.l.google.com:5349' },
        ],
      });

      // 2. Handle Incoming Stream
      this.peerConnection.ontrack = (event) => {
        if (!event.streams[0]) return;
        this.videoElement.srcObject = event.streams[0];
        // D-ID streams often start muted or need user interaction to play audio reliably
        // but we assume standard autoplay permissions in this context
        this.videoElement.play().catch(e => console.error("Video play error", e));
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.chatId) {
          this.sendICECandidate(event.candidate);
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log("Peer connection state:", this.peerConnection?.connectionState);
        if (this.peerConnection?.connectionState === 'connected') {
          this.onStateChange(ConnectionState.CONNECTED);
        } else if (this.peerConnection?.connectionState === 'failed') {
          this.onStateChange(ConnectionState.FAILED);
        }
      };

      // 3. Create Session (Chat)
      // Using D-ID Agents API: POST /agents/{id}/chat
      const createResp = await fetch(`https://api.d-id.com/agents/${this.agentId}/chat`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          streamId: this.streamId // Optional usually, but good for reconnection if supported
        })
      });

      if (!createResp.ok) {
        throw new Error(`Failed to create chat: ${createResp.statusText}`);
      }

      const createData = await createResp.json();
      const { id: chatId, offer, streamId } = createData;
      
      this.chatId = chatId;
      this.streamId = streamId;

      // 4. Handle SDP Offer
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // 5. Send SDP Answer
      const answerResp = await fetch(`https://api.d-id.com/agents/${this.agentId}/chat/${chatId}/answer`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ answer }),
      });

      if (!answerResp.ok) {
        throw new Error("Failed to send SDP answer");
      }

    } catch (error) {
      console.error("DID Connection Error:", error);
      this.onStateChange(ConnectionState.FAILED);
      this.disconnect();
    }
  }

  async sendICECandidate(candidate: RTCIceCandidate) {
    if (!this.chatId) return;
    try {
      await fetch(`https://api.d-id.com/agents/${this.agentId}/chat/${this.chatId}/ice`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ candidate, type: 'candidate' }),
      });
    } catch (e) {
      console.warn("Failed to send ICE candidate", e);
    }
  }

  async sendMessage(text: string) {
    if (!this.chatId) throw new Error("No active chat session");

    const resp = await fetch(`https://api.d-id.com/agents/${this.agentId}/chat/${this.chatId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        chatMode: 'Text', // Or 'Audio' if we were sending audio
        text: text
      }),
    });

    if (!resp.ok) {
      throw new Error("Failed to send message");
    }
    
    return resp.json();
  }

  disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.onStateChange(ConnectionState.DISCONNECTED);
  }
}
