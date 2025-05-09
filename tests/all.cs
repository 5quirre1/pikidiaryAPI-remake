using System;
using PeakRequests; // https://github.com/5quirre1/peakrequests
using System.Threading.Tasks;

namespace Wow
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var response = await PeakRequests.PeakRequests.Get("https://pikidiary-api.vercel.app?username=squirrel");
            if (response.IsSuccessful && response.Content != null)
            {
                var json = response.Json();
                Console.WriteLine(json);
            }
            else
          {
                Console.WriteLine("fail: " + response.ErrorMessage);
          }

        }
    }
}
