import { Card } from "@/legacy-components/card";

export const CardWrapper = () => {
  return (
    <Card>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Premium Features
          </h2>
        </div>

        <p className="leading-relaxed mb-6">
          Discover our latest collection of modern design components crafted
          with attention to detail and user experience in mind.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <span className="text-sm">Modern design system</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <span className="text-sm">Responsive components</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <span className="text-sm">Dark mode support</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
            Get Started
          </button>
          <button className="px-4 py-3 border border-gray-200 hover:border-gray-300 rounded-lg font-semibold transition-colors duration-200 hover:bg-gray-50">
            Learn More
          </button>
        </div>
      </div>
    </Card>
  );
};
