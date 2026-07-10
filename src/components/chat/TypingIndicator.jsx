export default function TypingIndicator() {
  return (
    <div className="bubble bubble--assistant typing" aria-label="Assistant is typing">
      <span className="typing__dot" /><span className="typing__dot" /><span className="typing__dot" />
    </div>
  );
}
