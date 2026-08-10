import HotelForm from "../HotelForm";

export default function NewHotelPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Add your hotel</h1>
      <HotelForm />
    </div>
  );
}
