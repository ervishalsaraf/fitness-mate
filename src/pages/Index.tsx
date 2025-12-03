import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Calendar, TrendingUp, Zap, PlusCircle, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import fitJogging from "@/assets/fit-jogging.png";
import fitYoga from "@/assets/fit-yoga.png";
import fitGym from "@/assets/fit-gym.png";
import fitExercise from "@/assets/fit-exercise.png";
import fitCricket from "@/assets/fit-cricket.png";
import fitFootball from "@/assets/fit-football.png";
import fitBasketball from "@/assets/fit-basketball.png";
import fitBadminton from "@/assets/fit-badminton.png";
import fitVolleyball from "@/assets/fit-volleyball.png";
import fitSnooker from "@/assets/fit-snooker.png";
import sketchBasketball from "@/assets/sketch-basketball.png";
import sketchCricket from "@/assets/sketch-cricket.png";
import sketchExercise from "@/assets/sketch-exercise.png";
import sketchFootball from "@/assets/sketch-football.png";
import sketchYoga from "@/assets/sketch-yoga.png";
import sketchRunning from "@/assets/sketch-running.png";

const activityData = [
  { name: "Jogging & Stretching", icon: fitJogging, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Yoga", icon: fitYoga, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Gym", icon: fitGym, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Exercise", icon: fitExercise, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Cricket", icon: fitCricket, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Football", icon: fitFootball, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Basketball", icon: fitBasketball, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Badminton", icon: fitBadminton, category: "Racket Sports", categoryColor: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  { name: "Volleyball", icon: fitVolleyball, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Snooker", icon: fitSnooker, category: "Racket Sports", categoryColor: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Fixed gradient background layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-accent z-0" />
      
      <ParticleBackground />
      
      {/* Left side promotional text */}
      <div className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-20 flex-col items-start">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl max-w-[200px]">
          <div className="space-y-3 text-white">
            <p className="text-lg font-bold leading-tight">🏃 Going for jogging?</p>
            <p className="text-base text-white/90">Looking for company?</p>
            <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/auth')}>
              <div className="bg-gradient-to-r from-slate-300 via-white to-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-shimmer bg-[length:200%_100%]">
                <span>Register yourself</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-300/50 to-white/50 rounded-xl blur-xl -z-10 animate-pulse" />
            </div>
            <p className="text-sm text-white/80 text-center">&</p>
            <div className="relative mt-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/groups')}>
              <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-900 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg animate-shimmer bg-[length:200%_100%]">
                <Sparkles className="h-4 w-4" />
                <span>Invite Your Buddies</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/50 to-yellow-300/50 rounded-xl blur-xl -z-10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Left side decorative images */}
      <div className="hidden xl:block fixed left-4 top-16 opacity-20 pointer-events-none z-0">
        <img src={sketchBasketball} alt="" className="w-12 h-12 object-contain animate-float" />
      </div>
      <div className="hidden xl:block fixed left-8 bottom-20 space-y-8 opacity-20 pointer-events-none z-0">
        <img src={sketchExercise} alt="" className="w-12 h-12 object-contain animate-float" style={{ animationDelay: '0.5s' }} />
        <img src={fitGym} alt="" className="w-10 h-10 object-contain animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Right side promotional text */}
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-20 flex-col items-end gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-2xl max-w-[200px]">
          <div className="space-y-3 text-white">
            <p className="text-lg font-bold leading-tight">🚴 Feeling stuck?</p>
            <p className="text-sm text-white/90">Escape with a private bike ride!</p>
            <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/groups')}>
              <div className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-emerald-900 px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-shimmer bg-[length:200%_100%]">
                <span>Plan with Buddies</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-teal-300/50 rounded-xl blur-xl -z-10 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-2xl max-w-[200px]">
          <div className="space-y-3 text-white">
            <p className="text-lg font-bold leading-tight">🥾 Need a break?</p>
            <p className="text-sm text-white/90">Start a private hiking event!</p>
            <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/groups')}>
              <div className="bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 text-purple-900 px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-shimmer bg-[length:200%_100%]">
                <span>Create Event</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/50 to-violet-300/50 rounded-xl blur-xl -z-10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side decorative images */}
      <div className="hidden xl:block fixed right-4 top-16 opacity-20 pointer-events-none z-0">
        <img src={sketchFootball} alt="" className="w-12 h-12 object-contain animate-float" style={{ animationDelay: '0.8s' }} />
      </div>
      <div className="hidden xl:block fixed right-8 bottom-20 space-y-8 opacity-20 pointer-events-none z-0">
        <img src={sketchRunning} alt="" className="w-14 h-14 object-contain animate-float" style={{ animationDelay: '1.2s' }} />
        <img src={fitFootball} alt="" className="w-10 h-10 object-contain animate-float" style={{ animationDelay: '2.2s' }} />
      </div>

      <div className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-8 max-w-3xl">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold">Fit Connect24</h1>
          <div className="space-y-2">
            <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full text-lg font-bold animate-pulse shadow-xl">
              🎉 Get 30 Days Premium FREE!
            </div>
            <p className="text-xl md:text-2xl text-white/90">
              Plan your cricket matches, basketball games, snooker sessions, and yoga classes. Find fitness partners and join group activities 24/7
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/pricing")}
            >
              <Zap className="mr-2 h-5 w-5" />
              View Pricing
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-white/15 transition-all">
              <PlusCircle className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Create Events</h3>
              <p className="text-sm text-white/80">Organize cricket matches, basketball games, yoga sessions, and more</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-white/15 transition-all">
              <Users className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Find Buddies</h3>
              <p className="text-sm text-white/80">Connect with people nearby who share your fitness interests</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-white/15 transition-all">
              <Calendar className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Join Groups</h3>
              <p className="text-sm text-white/80">Participate in local fitness events and group activities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:bg-white/15 transition-all">
              <TrendingUp className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Stay Motivated</h3>
              <p className="text-sm text-white/80">Track progress, earn badges, and maintain your streaks</p>
            </div>
          </div>

          <div className="mt-16 bg-white/5 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="font-semibold mb-2">Create or Join</h3>
                <p className="text-sm text-white/80">Browse events for your favorite sports and activities</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="font-semibold mb-2">Connect</h3>
                <p className="text-sm text-white/80">Meet nearby fitness enthusiasts in your area</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="font-semibold mb-2">Plan Games</h3>
                <p className="text-sm text-white/80">Organize cricket, basketball, snooker, or yoga sessions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <h3 className="font-semibold mb-2">Stay Active</h3>
                <p className="text-sm text-white/80">Build your fitness community and achieve your goals</p>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-3">Popular Activities</h2>
            <p className="text-white/80 mb-8">Create events and find partners for any of these activities</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {activityData.map((activity) => (
                <div 
                  key={activity.name}
                  className="flex flex-col items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all hover:scale-105"
                >
                  <img 
                    src={activity.icon} 
                    alt={activity.name}
                    className="w-16 h-16 object-contain transition-transform hover:scale-110 drop-shadow-lg"
                  />
                  <span className="text-sm font-medium text-center">{activity.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${activity.categoryColor} border`}
                  >
                    {activity.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
