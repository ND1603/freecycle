export default function StatusStamp({ status }) {
  const isAvailable = status === 'Available';
  return (
    <span className={`stamp ${isAvailable ? 'stamp-available' : 'stamp-claimed'}`}>
      {status}
    </span>
  );
}
