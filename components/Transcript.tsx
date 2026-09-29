import { QAItem } from '@/types/interview';

export default function Transcript({ items }: { items: QAItem[] }) {
  return (
    <>
      {items.map((qa, i) => (
        <div className="turn" key={i}>
          <div className="msg ai">
            <div className="avatar">AI</div>
            <div className="bubble">
              <span className="q-index">Q{i + 1}</span>
              {qa.question}
            </div>
          </div>
          <div className="msg me">
            <div className="avatar">ME</div>
            <div className="bubble">{qa.answer}</div>
          </div>
          {qa.feedback && (
            <div className="fb">
              <b>Feedback</b>
              {qa.feedback}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
