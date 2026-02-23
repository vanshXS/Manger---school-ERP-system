export default function ErrorMessage({message}) {
    return (
        <div className="w-full bg-red-100 text-red-700 border border-red-300 rounded-lg p-4  text-base">
              {message || 'Something went wrong. Please try again.'}
        </div>
    )
}