//手写Promise

// 第一步:创建构造的并且初始化属性
function _Promise(executor){
    // promise实例的初始值设定
    this.PromiseState='pending'
    this.PromiseResult=undefined
    this.callback=[]

    // 因为newPromise的时候executor里面有resolve和reject两个形参,所以这里要传两个实参
    // 而且这两个参数是函数,所以需要定义这两个函数,这两个函数需要改变实例对象的属性,所以要先保存this并绑定给它们
    // try catch 是因为executor里面抛出异常之后也能改变promise实例的状态,并且PromiseResult===异常错误信息

    // 一直重复改变实例的值和属性,封装成一个函数  
    function changePromise(state,result){
        // 因为promise的状态只能更改一次,所以在修改之前先判断状态是否为pending
        if(this.PromiseState!== 'pending') return
        this.PromiseState=state
        this.PromiseResult=result
        if(this.PromiseState==='fulfilled' && this.callback.length>0){
            // this.callback.onResolved(this.PromiseResult)
            this.callback.forEach(element => {
                element.onResolved(this.PromiseResult)
            });
        }
        if(this.PromiseState==='rejected' && this.callback.length>0){

            // this.callback.onRejected(this.PromiseResult)
            this.callback.forEach(element => {
                element.onRejected(this.PromiseResult)
            });
        }
    }
    const _this=this
    try{
    executor(resolve.bind(_this),reject.bind(_this))

    }catch(err){
        // 这里的this就是指向的实例对象
        // this.PromiseState='rejected'
        // this.PromiseResult=err
        changePromise.call(this,'rejected',err)
    }
    function resolve(data){
        //  1.修改对象的状态(PromiseState)
        // this.PromiseState='fulfilled'
        //  2.修改对象的结果值
        // this.PromiseResult=data
        changePromise.call(this,'fulfilled',data)
    }
    function reject(data){
        //  1.修改对象的状态(PromiseState)
        // this.PromiseState='rejected'
        // 2.修改对象的结果值
        // this.PromiseResult=data
        changePromise.call(this,'rejected',data)
    }


}
// 第二步: 添加实例上的then()方法
// then(onResolved,onRejected)实例的状态为成功则调用onResolved，实例的状态为失败则调用onResolved，
// 返回的是一个_Promise 对象，对象的状态由 onResolved,onRejected的返回值确定。
// 如果 onResolved,onRejected 的返回值是一个非_Promise 对象，则返回的对象的状态为成功，结果为onResolved,onRejected 的返回值
// 如果onResolved,onRejected 的返回值是一个_Promise 对象，则返回的对象的状态和onResolved,onRejected 的返回值一致。结果为onResolved,onRejected 的返回值的结果。
// onResolved,onRejected  这两个函数是异步执行的
_Promise.prototype.then=function(onResolved,onRejected){
    // 这里是实现catch时需要判断传过来的参数是否是函数
        if(!(onResolved instanceof Function)){
           onResolved=value=>value
        }
        if(!(onRejected instanceof Function)){
            onRejected=(reason)=>{
                throw reason
            }
        }
    // 这里开始就有点绕了。。。
    return new _Promise((resolve,reject)=>{
            let callback=(state)=>{
              setTimeout(()=>{
                try{
                    let result
                    if(state==='fulfilled'){
                     result = onResolved(this.PromiseResult)
                    }else if(state==='rejected'){
                     result = onRejected(this.PromiseResult)
                    }
                   
                    if(result instanceof _Promise){
                        result.then((value)=>{
                            resolve(value)
                        },(reason)=>{
                            reject(reason)
                        })
                    }else{
                        resolve(result)
                    }

                }catch(e){
                    reject(e)
                }
              })
            }
            //  executor是同步任务时
            if(this.PromiseState==='fulfilled'){
               callback('fulfilled')
            }
            if(this.PromiseState==='rejected'){
                callback('rejected')
            }
            // executor是异步任务时
            if(this.PromiseState==='pending'){
                // 保存回调函数,然后在改变状态时执行
                // 因为可以多次调用then()方法并且多次执行里面的回调,所以这里用数组的方式存储
                this.callback.push({
                    onResolved:()=>{
                        callback('fulfilled')
                    },
                    onRejected:()=>{
                        callback('rejected')
                    }
                })
            }

    })

}
// 封装catch()  
// 异常穿透就要改造then方法了，在then方法中先判断onResolved和onJected是不是一个函数，如果不是就给它们默认值

_Promise.prototype.catch=function(onRejected){
    return this.then(undefined,onRejected)
}


// 封装 _Promise.resolve(data)
 _Promise.resolve=function(data){
    // _Promise.resolve(data)需要返回一个_Promise实例，状态由data确定
    // 如果data是非promise对象 则返回一个成功的实例，并且实例的结果就是data
    // 如果data是promise对象，则返回的实例的状态由data的状态确定，data的结果就是实例的结果

    return new _Promise((resolve,reject)=>{
        if (data instanceof _Promise) {
            data.then((value)=>{
                resolve(value)
            },(reason)=>{
                reject(reason)
            })
        }else{
            resolve(data)
        }
    })
 }
//  封装_Promise.reject(data)
// 不管传过来的data 是什么都返回一个失败的promise对象，返回的promise对象的结果就是data
_Promise.reject=function(data){
    return new _Promise((resolve,reject)=>{
        reject(data)
    })
}
// 封装_Promise.all(promises)
// 传过来一般是一个数组，返回一个_Promise对象。
// 如果promises数组的状态全部为成功，则返回的_promise对象为成功，结果为数组，数组里面就是所有的promise对象的结果。且顺序一致
// 如果promises数组的状态有一个为失败，则返回的_promise对象为失败，结果就是失败的promise对象的结果
_Promise.all=function(promises){
    return new _Promise((resolve,reject)=>{
        let arr=[]
        for(let i=0;i<promises.length;i++){
            if(promises[i].PromiseState==='fulfilled'){
                // 这里这样写是为了保证顺序
                arr[i]=promises[i].PromiseResult
            }else if(promises[i].PromiseState==='rejected'){
                reject(promises[i].PromiseResult)
            }else{
                return undefined
            }
        }
        resolve(arr)
    })
}
// 封装_Promise.race(promises)
// 传过来一般是一个数组，返回一个_Promise对象。
// 数组中谁先改变状态，返回的状态和结果就和先改变状态的promise一致。

_Promise.race=function(promises){
   return new _Promise((resolve,reject)=>{
        for(let i = 0; i<promises.length;i++){
            promises[i].then((value)=>{
                resolve(value)
            },(reason)=>{
                reject(reason)
            })
        }
    })
}
