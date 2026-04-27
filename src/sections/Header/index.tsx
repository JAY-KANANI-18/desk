// LEGACY - not mounted in current router, pending removal
export const Header = () => {
  return (
    <div className="bg-no-repeat box-border caret-transparent flex flex-col h-full justify-between mx-4 md:mx-16">
      <div className="bg-no-repeat box-border caret-transparent">
        <div className="bg-no-repeat box-border caret-transparent flex grow flex-wrap justify-between mt-1 -mb-3 -mx-3 md:mt-8">
          <div className="items-center bg-no-repeat box-border caret-transparent flex basis-0 grow max-w-full w-full my-auto p-3">
            <img
              src="https://c.animaapp.com/ml7j8uraO4VPFm/assets/logo_black.svg"
              className="bg-no-repeat box-border caret-transparent max-w-full w-32"
            />
          </div>
          <div className="bg-no-repeat box-border caret-transparent basis-0 max-w-full w-full p-3">
            <div className="bg-no-repeat box-border caret-transparent gap-x-2 flex gap-y-2">
              <button
                type="button"
                className="relative text-gray-800 text-sm font-medium items-center bg-transparent bg-no-repeat caret-transparent flex h-8 justify-center tracking-[-0.09px] leading-4 text-center text-nowrap w-8 border border-zinc-700/20 p-1 rounded-lg border-solid hover:bg-neutral-600/10"
              >
                <i className="text-[22px] italic bg-no-repeat box-border caret-transparent block h-[22px] leading-[22px] text-nowrap w-[22px] before:accent-auto before:bg-no-repeat before:box-border before:caret-transparent before:text-gray-800 before:text-[22px] before:not-italic before:normal-nums before:font-normal before:tracking-[-0.09px] before:leading-[22px] before:list-outside before:list-disc before:pointer-events-auto before:text-center before:indent-[0px] before:normal-case before:text-nowrap before:align-top before:visible before:border-separate before:font-iconfont"></i>
              </button>
              <div className="items-start bg-no-repeat box-border caret-transparent flex flex-col min-w-[140px]">
                <div className="bg-no-repeat box-border caret-transparent grid grow [grid-template-areas:'prepend_control_append''a_messages_b'] grid-cols-[max-content_minmax(0px,1fr)_max-content] grid-rows-[auto_auto] h-fit w-full">
                  <div className="bg-no-repeat box-border caret-transparent flex col-end-[control] col-start-[control] row-end-[control] row-start-[control]">
                    <div
                      role="combobox"
                      className="relative text-[13.008px] bg-no-repeat box-border caret-transparent grid basis-[0%] grow shrink-0 col-end-[control] col-start-[control] row-end-[control] row-start-[control] [grid-template-areas:'prepend-inner_field_clear_append-inner'] grid-cols-[min-content_minmax(0px,1fr)_min-content_min-content] tracking-[0.12195px] leading-[19.512px] max-w-full border border-zinc-700/20 pl-3 rounded-lg border-solid"
                    >
                      <div className="absolute bg-no-repeat box-border caret-transparent h-full pointer-events-none w-full rounded-lg left-0 top-0"></div>
                      <div className="absolute bg-no-repeat box-border caret-transparent top-[calc(100%_-_2px)] w-full overflow-hidden rounded-b-lg inset-x-0">
                        <div
                          role="progressbar"
                          className="relative box-border caret-transparent h-0 translate-x-[-50.0%] w-full overflow-hidden left-2/4 top-0"
                        >
                          <div className="absolute text-white bg-blue-500 box-border caret-transparent opacity-[0.12] w-full left-0 inset-y-0"></div>
                          <div className="bg-black/90 box-border caret-transparent">
                            <div className="absolute text-white bg-blue-500 box-border caret-transparent left-0 inset-y-0"></div>
                            <div className="absolute text-white bg-blue-500 box-border caret-transparent left-0 inset-y-0"></div>
                          </div>
                        </div>
                      </div>
                      <div className="relative items-start bg-no-repeat box-border caret-transparent flex basis-[0%] grow shrink-0 col-end-[field] col-start-[field] row-end-[field] row-start-[field] rounded-lg">
                        <div className="relative text-sm items-center bg-no-repeat box-border caret-transparent gap-x-0.5 flex flex-wrap tracking-[0.13125px] leading-[18px] min-h-[30px] opacity-[0.87] gap-y-1.5 w-full pr-1.5 py-1 rounded-lg">
                          <div className="items-center bg-no-repeat box-border caret-transparent flex max-w-full w-full mr-0.5">
                            <div className="text-[13.008px] bg-no-repeat box-border caret-transparent tracking-[0.12195px] break-words text-ellipsis text-nowrap overflow-hidden">
                              <span className="bg-no-repeat box-border caret-transparent break-words text-nowrap">
                                🇬🇧
                              </span>
                              <span className="bg-no-repeat box-border caret-transparent break-words text-nowrap pr-1">
                                Language
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="items-start bg-no-repeat box-border caret-transparent flex col-end-[append-inner] col-start-[append-inner] row-end-[append-inner] row-start-[append-inner]">
                        <i className="text-lg italic self-center bg-no-repeat box-border caret-transparent block leading-[18px] ml-1 mr-3 before:accent-auto before:bg-no-repeat before:box-border before:caret-transparent before:text-black/90 before:text-lg before:not-italic before:normal-nums before:font-normal before:tracking-[0.12195px] before:leading-[18px] before:list-outside before:list-disc before:pointer-events-auto before:text-start before:indent-[0px] before:normal-case before:align-top before:visible before:border-separate before:font-iconfont"></i>
                        <i className="relative text-[22px] italic items-center bg-no-repeat box-border caret-transparent hidden h-5 justify-center tracking-[normal] leading-[22px] min-w-5 opacity-60 text-center align-middle w-5 ml-1 before:accent-auto before:bg-no-repeat before:box-border before:caret-transparent before:text-black/90 before:text-[22px] before:not-italic before:normal-nums before:font-normal before:tracking-[normal] before:leading-[22px] before:list-outside before:list-disc before:pointer-events-auto before:text-center before:indent-[0px] before:normal-case before:align-top before:visible before:border-separate before:font-iconfont"></i>
                      </div>
                      <div className="absolute items-stretch bg-no-repeat box-border caret-transparent flex h-full pointer-events-none w-full inset-x-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="items-center bg-no-repeat box-border caret-transparent flex grow flex-wrap justify-center -mb-3 -mx-3">
        <div className="text-[13.008px] bg-no-repeat box-border caret-transparent basis-0 grow leading-[23.4144px] max-w-[540px] min-w-[380px] w-full p-3">
          <div className="bg-no-repeat box-border caret-transparent h-full">
            <div className="bg-no-repeat box-border caret-transparent">
              <span className="text-gray-800 text-2xl font-bold bg-no-repeat box-border caret-transparent tracking-[-0.47px] leading-8">
                Sign in
              </span>
            </div>
            <div className="bg-no-repeat box-border caret-transparent my-2">
              <span className="text-gray-500 text-base font-semibold bg-no-repeat box-border caret-transparent tracking-[-0.18px] leading-5">
                Enter your credentials to access your account.
              </span>
            </div>
            <form className="bg-no-repeat box-border caret-transparent h-full">
              <div className="bg-no-repeat box-border caret-transparent my-8">
                <a
                  type="button"
                  href=""
                  className="relative text-gray-800 text-sm font-medium items-center bg-no-repeat box-border caret-transparent inline-flex h-8 justify-center tracking-[-0.09px] leading-4 text-nowrap w-full border border-zinc-700/20 px-3.5 rounded-lg border-solid"
                >
                  <div className="bg-no-repeat box-border caret-transparent text-nowrap px-2">
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google g"
                      className="bg-no-repeat box-border caret-transparent h-[18px] max-w-full text-nowrap w-[18px]"
                    />
                  </div>
                  Continue with Google
                </a>
              </div>
              <div className="items-center bg-no-repeat box-border caret-transparent flex grow flex-wrap my-8">
                <div className="bg-no-repeat box-border caret-transparent basis-0 grow max-w-full w-full">
                  <div className="self-stretch bg-zinc-700/20 bg-no-repeat box-border caret-transparent flex h-px w-full mt-1 rounded-lg"></div>
                </div>
                <div className="bg-no-repeat box-border caret-transparent basis-0 max-w-full capitalize w-full mx-4">
                  <span className="text-gray-400 text-sm bg-no-repeat box-border caret-transparent tracking-[-0.09px] leading-5">
                    Or
                  </span>
                </div>
                <div className="bg-no-repeat box-border caret-transparent basis-0 grow max-w-full w-full">
                  <div className="self-stretch bg-zinc-700/20 bg-no-repeat box-border caret-transparent flex h-px w-full mt-1 rounded-lg"></div>
                </div>
              </div>
              <div className="bg-no-repeat box-border caret-transparent flex grow flex-wrap -mb-1 -mx-1">
                <div className="bg-no-repeat box-border caret-transparent basis-full shrink-0 max-w-full w-full pb-8 px-1">
                  <div className="relative items-start bg-no-repeat box-border caret-transparent flex flex-col w-full">
                    <div className="text-base bg-no-repeat box-border caret-transparent grid grow [grid-template-areas:'prepend_control_append''a_messages_b'] grid-cols-[max-content_minmax(0px,1fr)_max-content] grid-rows-[auto_auto] leading-6 w-full">
                      <div className="bg-no-repeat box-border caret-transparent flex col-end-[control] col-start-[control] row-end-[control] row-start-[control]">
                        <div className="relative text-[13.008px] bg-white bg-no-repeat box-border caret-transparent grid basis-[0%] grow shrink-0 col-end-[control] col-start-[control] row-end-[control] row-start-[control] [grid-template-areas:'prepend-inner_field_clear_append-inner'] grid-cols-[min-content_minmax(0px,1fr)_min-content_min-content] tracking-[0.12195px] leading-[19.512px] max-w-full border border-zinc-700/20 rounded-lg border-solid">
                          <div className="absolute bg-no-repeat box-border caret-transparent h-full pointer-events-none w-full rounded-lg left-0 top-0"></div>
                          <div className="absolute bg-no-repeat box-border caret-transparent top-[calc(100%_-_2px)] w-full overflow-hidden rounded-b-lg inset-x-0">
                            <div
                              role="progressbar"
                              className="relative box-border caret-transparent h-0 translate-x-[-50.0%] w-full overflow-hidden left-2/4 top-0"
                            >
                              <div className="absolute text-white bg-blue-500 box-border caret-transparent opacity-[0.12] w-full left-0 inset-y-0"></div>
                              <div className="bg-black/90 box-border caret-transparent">
                                <div className="absolute text-white bg-blue-500 box-border caret-transparent left-0 inset-y-0"></div>
                                <div className="absolute text-white bg-blue-500 box-border caret-transparent left-0 inset-y-0"></div>
                              </div>
                            </div>
                          </div>
                          <div className="items-start bg-no-repeat box-border caret-transparent flex col-end-[prepend-inner] col-start-[prepend-inner] row-end-[prepend-inner] row-start-[prepend-inner]"></div>
                          <div className="relative items-start bg-no-repeat box-border caret-transparent flex basis-[0%] grow shrink-0 col-end-[field] col-start-[field] row-end-[field] row-start-[field] rounded-lg">
                            <input
                              name="field_2"
                              placeholder="Email address"
                              type="text"
                              value=""
                              className="relative text-sm items-center bg-transparent bg-no-repeat box-border caret-transparent gap-x-0.5 flex basis-[0%] grow flex-wrap h-full tracking-[0.13125px] leading-[18px] max-h-[30px] min-h-[30px] gap-y-1.5 w-full px-2.5 py-2 rounded-lg"
                            />
                          </div>
                          <div className="items-start bg-no-repeat box-border caret-transparent hidden col-end-[clear] col-start-[clear] row-end-[clear] row-start-[clear] overflow-hidden"></div>
                          <div className="items-start bg-no-repeat box-border caret-transparent flex col-end-[append-inner] col-start-[append-inner] row-end-[append-inner] row-start-[append-inner]"></div>
                          <div className="absolute items-stretch bg-no-repeat box-border caret-transparent flex h-full pointer-events-none w-full inset-x-0"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-no-repeat box-border caret-transparent basis-full shrink-0 max-w-full w-full mb-8 pb-1 px-1">
                  <div className="relative items-start bg-no-repeat box-border caret-transparent flex flex-col w-full">
                    <div className="text-base bg-no-repeat box-border caret-transparent grid grow [grid-template-areas:'prepend_control_append''a_messages_b'] grid-cols-[max-content_minmax(0px,1fr)_max-content] grid-rows-[auto_auto] leading-6 w-full">
                      <div className="bg-no-repeat box-border caret-transparent flex col-end-[control] col-start-[control] row-end-[control] row-start-[control]">
                        <div className="relative text-[13.008px] bg-white bg-no-repeat box-border caret-transparent grid basis-[0%] grow shrink-0 col-end-[control] col-start-[control] row-end-[control] row-start-[control] [grid-template-areas:'prepend-inner_field_clear_append-inner'] grid-cols-[min-content_minmax(0px,1fr)_min-content_min-content] tracking-[0.12195px] leading-[19.512px] max-w-full border border-zinc-700/20 rounded-lg border-solid">
                          <div className="absolute bg-no-repeat box-border caret-transparent h-full pointer-events-none w-full rounded-lg left-0 top-0"></div>
                          <div className="absolute bg-no-repeat box-border caret-transparent top-[calc(100%_-_2px)] w-full overflow-hidden rounded-b-lg inset-x-0">
                            <div
                              role="progressbar"
                              className="relative box-border caret-transparent h-0 translate-x-[-50.0%] w-full overflow-hidden left-2/4 top-0"
                            >
                              <div className="absolute text-white bg-blue-500 box-border caret-transparent opacity-[0.12] w-full left-0 inset-y-0"></div>
                              <div className="bg-black/90 box-border caret-transparent">
                                <div className="absolute text-white bg-blue-500 box-border caret-transparent left-0 inset-y-0"></div>
                                <div className="absolute text-white bg-blue-500 box-border caret-transparent left-0 inset-y-0"></div>
                              </div>
                            </div>
                          </div>
                          <div className="items-start bg-no-repeat box-border caret-transparent flex col-end-[prepend-inner] col-start-[prepend-inner] row-end-[prepend-inner] row-start-[prepend-inner]"></div>
                          <div className="relative items-start bg-no-repeat box-border caret-transparent flex basis-[0%] grow shrink-0 col-end-[field] col-start-[field] row-end-[field] row-start-[field] rounded-lg">
                            <input
                              name="field_3"
                              placeholder="Password"
                              type="password"
                              value=""
                              className="relative text-sm items-center bg-transparent bg-no-repeat box-border caret-transparent gap-x-0.5 flex basis-[0%] grow flex-wrap h-full tracking-[0.13125px] leading-[18px] max-h-[30px] min-h-[30px] gap-y-1.5 w-full pl-2.5 pr-0 py-2 rounded-lg"
                            />
                          </div>
                          <div className="items-start bg-no-repeat box-border caret-transparent hidden col-end-[clear] col-start-[clear] row-end-[clear] row-start-[clear] overflow-hidden"></div>
                          <div className="items-start bg-no-repeat box-border caret-transparent flex col-end-[append-inner] col-start-[append-inner] row-end-[append-inner] row-start-[append-inner]">
                            <div className="bg-no-repeat box-border caret-transparent flex flex-col h-full justify-center align-middle pr-2.5">
                              <div className="bg-no-repeat box-border caret-transparent h-5 pl-2.5">
                                <i className="text-gray-800 text-xl italic bg-no-repeat box-border caret-transparent fill-gray-800 leading-5 before:accent-auto before:bg-no-repeat before:box-border before:caret-transparent before:text-gray-800 before:fill-gray-800 before:text-xl before:not-italic before:normal-nums before:font-normal before:tracking-[0.12195px] before:leading-5 before:list-outside before:list-disc before:pointer-events-auto before:text-start before:indent-[0px] before:normal-case before:align-top before:visible before:border-separate before:font-iconfont"></i>
                              </div>
                            </div>
                          </div>
                          <div className="absolute items-stretch bg-no-repeat box-border caret-transparent flex h-full pointer-events-none w-full inset-x-0"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-no-repeat box-border caret-transparent flex grow flex-wrap -m-3">
                    <div className="bg-no-repeat box-border caret-transparent basis-0 grow max-w-full text-right w-full mt-2 p-3">
                      <span className="text-gray-500 text-sm bg-no-repeat box-border caret-transparent tracking-[-0.09px] leading-5">
                        Forgot password?
                      </span>
                      <a
                        href="/user/password/forget"
                        className="text-blue-600 bg-no-repeat box-border caret-transparent"
                      >
                        <span className="text-blue-500 text-sm bg-no-repeat box-border caret-transparent tracking-[-0.09px] leading-5">
                          Reset password
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-no-repeat box-border caret-transparent w-full">
                <button
                  type="submit"
                  className="relative text-neutral-400 text-sm font-medium items-center bg-zinc-200 bg-no-repeat caret-transparent inline-flex fill-white h-8 justify-center tracking-[-0.09px] leading-4 text-center text-nowrap w-full border border-zinc-200 px-3.5 py-0 rounded-lg border-solid"
                >
                  Sign in
                </button>
              </div>
            </form>
            <div className="bg-no-repeat box-border caret-transparent flex grow flex-wrap -m-3">
              <div className="bg-no-repeat box-border caret-transparent basis-0 grow max-w-full text-center w-full mt-1 pt-10 pb-3 px-3">
                <a
                  href="/user/sso"
                  type="button"
                  className="relative text-gray-800 text-sm font-medium items-center bg-no-repeat box-border caret-transparent inline-flex h-8 justify-center tracking-[-0.09px] leading-4 text-nowrap w-full border border-zinc-700/20 px-3.5 rounded-lg border-solid"
                >
                  Use single sign-on (SSO)
                </a>
              </div>
            </div>
            <div className="bg-no-repeat box-border caret-transparent basis-0 grow max-w-full text-center w-full my-8 px-3">
              <span className="text-gray-800 text-sm bg-no-repeat box-border caret-transparent tracking-[-0.09px] leading-5">
                Don&#39;t have an account?
              </span>
              <span className="text-blue-500 text-sm bg-no-repeat box-border caret-transparent tracking-[-0.09px] leading-5">
                Create one
              </span>
            </div>
          </div>
          <footer className="bg-no-repeat box-border caret-transparent hidden text-center w-full md:block"></footer>
        </div>
      </div>
      <div className="bg-no-repeat box-border caret-transparent grow"></div>
    </div>
  );
};
