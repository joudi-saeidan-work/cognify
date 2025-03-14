import React from "react";

const SpeechModal = ({
  setShowModel,
  url,
}: {
  setShowModel: (value: boolean) => void;
  url: string;
}) => (
  <div data-testid="speech-modal">
    Mock Speech Modal
    <span data-testid="audio-url">{url}</span>
    <button
      data-testid="close-speech-button"
      onClick={() => setShowModel(false)}
    >
      Close
    </button>
  </div>
);

export default SpeechModal;
