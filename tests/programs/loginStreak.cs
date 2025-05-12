using PeakRequests; // https://github.com/5quirre1/PeakRequests/
using System;
using System.Threading.Tasks;


namespace PikiDiaryApiTest
{
    class Program
    {
        public static string Question(string question, string continuemsg)
        {
            while (true)
            {
                Console.Write(question);
                var input = Console.ReadLine();
                if (!string.IsNullOrWhiteSpace(input))
                {
                    return input;
                }
                Console.WriteLine(continuemsg);
            }
        }

        static async Task Main()
        {
            var username = Question("enter a pikidiary username: ", "put a username ...");
            var response = await PeakRequests.PeakRequests.Get($"https://pikidiary-api.vercel.app/?username={username}");
            if (response != null)
            {
                var json = response.Json();
                var loginStreak = json?["loginStreak"];
                if (loginStreak == null)
                {
                    Console.WriteLine("they don't have a login streak ig so here's full response");
                    Console.WriteLine(json);
                    return;
                }
                Console.WriteLine($"{username}'s login streak is: {loginStreak} days");
                
            }
            else
            {
                Console.WriteLine("Failed to receive response.");
            }
        }
    }
}
