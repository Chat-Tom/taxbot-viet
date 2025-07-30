import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, User, Building, Star } from "lucide-react";
import { t } from "@/lib/i18n";
import type { ServicePackage } from "@shared/schema";

export default function ServicePackages() {
  const { data: packages, isLoading } = useQuery<ServicePackage[]>({
    queryKey: ["/api/packages"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded mt-8"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getPackageIcon = (index: number) => {
    const icons = [User, Star, Building];
    const Icon = icons[index] || User;
    return <Icon className="h-8 w-8" />;
  };

  const getPackageColors = (index: number) => {
    const colors = [
      { bg: "bg-blue-50", text: "text-blue-600", button: "bg-blue-600 hover:bg-blue-700" },
      { bg: "bg-green-50", text: "text-green-600", button: "bg-green-600 hover:bg-green-700" },
      { bg: "bg-purple-50", text: "text-purple-600", button: "bg-purple-600 hover:bg-purple-700" },
    ];
    return colors[index] || colors[0];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {packages?.map((pkg: ServicePackage, index: number) => {
        const colors = getPackageColors(index);
        const features = pkg.featuresVi as string[];
        
        return (
          <Card 
            key={pkg.id} 
            className={`hover:shadow-xl hover:scale-105 transition-all duration-200 ${
              pkg.isPopular ? "border-2 border-gov-blue relative" : ""
            }`}
          >
            {pkg.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-accent-orange text-white px-4 py-1 text-xs font-semibold animate-pulse">
                  🌟 GÓI ĐẶC BIỆT
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className={colors.text}>
                  {getPackageIcon(index)}
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-blue-600 mb-2 uppercase">
                {pkg.nameVi}
              </CardTitle>
              <p className="text-gray-600 text-sm">
                {pkg.descriptionVi}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="text-center mb-6">
                <span className="text-3xl font-bold text-red-600 bg-yellow-100 px-3 py-1 rounded-lg shadow-md">
                  {parseInt(pkg.price).toLocaleString('vi-VN')}₫/tháng
                </span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-trust-green mr-3 flex-shrink-0" />
                    {feature.includes('MISA') ? (
                      <span>
                        <span className="font-semibold text-blue-700">{feature}</span>
                        <span className="block text-xs text-blue-600 ml-1">
                          (Chuẩn luật thuế Việt Nam - Tuân thủ 100% quy định)
                        </span>
                      </span>
                    ) : (
                      feature
                    )}
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${colors.button} text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg`}
              >
                {t('choosePackage')}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
