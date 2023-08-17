function shortHash(address)
{
  return address.substr(0,4)+"..."+address.substr(address.length-4,address.length)
}

module.exports = {
  shortHash
}