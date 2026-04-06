export function ListCard({ title, items }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul className="list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="status-box empty">표시할 내용이 아직 없어.</div>
      )}
    </section>
  );
}
