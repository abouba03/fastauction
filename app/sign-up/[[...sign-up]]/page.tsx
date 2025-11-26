import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FastAuction</h1>
          <p className="text-gray-600">Créez votre compte pour commencer</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
