/*
 * @Author: Mao Guijun
 * @Date: 2018-07-18 11:30:06
 * @Last Modified by: Mao Guijun
 * @Last Modified time: 2018-08-16 13:50:10
 */
import React, { PureComponent } from 'react'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { pathJump } from '../../../utils/'
import { titles as _tit, rootPath, tableAll, locale, timetest } from '../../../config'
import Immutable from 'immutable'
import { fetchQuestion, newResult, fetchChapterInfo } from '../modules/question'
import {
  NavBar,
  Icon,
  Steps,
  WingBlank,
  ActivityIndicator,
  WhiteSpace,
  Toast,
  Modal,
  Button,
  Checkbox
} from 'antd-mobile'
import './question_.scss'
import { login } from '../../Login/modules/login'
import { encryptAes, encryptSha256, formatSecondToMinute } from '../../../utils/common'
import * as _ from 'lodash'
// import QuestionList from './components/questionlist'
import { message } from 'antd'
import { postMessage } from '../../../utils/onmessage'
const Step = Steps.Step
const alert = Modal.alert
const CheckboxItem = Checkbox.CheckboxItem

class Question extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentStep: 1,
      questionList: Immutable.fromJS([]), // 所有的题目
      correctList: Immutable.fromJS([]), // 正确的题目
      errorList: Immutable.fromJS([]), // 错误的题目
      Indexquestion: 0, // 当前显示的题目的index
      timerest: timetest,
      animating: true
    }
  }

  // WARNING! To be deprecated in React v17. Use componentDidMount instead.
  // componentWillMount () {
  //   const {
  //     dispatch,
  //     location: { pathname }
  //   } = this.props
  //   const json = {
  //     mail: '1053475583@qq.com',
  //     password: encryptAes(`${encryptSha256('Qwerty3.')},${new Date().getTime()}`),
  //     type: '3',
  //     equipmentType: '2'
  //   }
  //   dispatch(login(json))
  //   // console.log('pathname', location)
  // }

  componentDidMount () {
    const {
      dispatch,
      location: { search },
      intl: { formatMessage }
    } = this.props

    const studentId = sessionStorage.getItem('userid')
    const chapterId = sessionStorage.getItem('chapterId')
    if (!studentId) {
      this.setState({ animating: false })
      alert(formatMessage({ id: 'plxlogin' }), '', [{ text: 'Ok', onPress: () => postMessage() }])
      return
    }

    dispatch(fetchChapterInfo(chapterId)).then(e => {
      if (e.error) {
        message.error(e.error.message)
      } else {
        this.setState({
          chapterInfo: e.payload.obj
        })
      }
    })

    const questionList_ = JSON.parse(localStorage.getItem('questionList') || '[]')
    const correctList_ = JSON.parse(localStorage.getItem('correctList') || '[]')
    const errorList_ = JSON.parse(localStorage.getItem('errorList') || '[]')
    console.log(73, questionList_, correctList_, errorList_)
    if (
      (questionList_ && questionList_.length > 0) ||
      (correctList_ && correctList_.length > 0) ||
      (errorList_ && errorList_.length > 0)
    ) {
      this.setState({
        questionList: Immutable.fromJS(questionList_),
        correctList: Immutable.fromJS(correctList_),
        errorList: Immutable.fromJS(errorList_),
        animating: false
      })
      return
    }

    const json = { limit: tableAll, chapterId: chapterId, studentId }
    dispatch(fetchQuestion(json)).then(e => {
      this.setState({
        animating: false
      })

      if (e.error) {
        console.log(e.error)
        // Toast.info(e.error, 1)
        return
      }
      console.log(57, e)
      this.setState({
        questionList: Immutable.fromJS(e.payload.objs)
      })
    })
    // this.time = setInterval(() => {
    //   const { timerest } = this.state
    //   if (timerest < 1) {
    //     clearInterval(this.time)
    //     return
    //   }
    //   this.setState({
    //     timerest: timerest - 1
    //   })
    // }, 1000)
  }

  // componentWillUnmount () {
  //   clearInterval(this.time)
  // }

  componentDidUpdate (prevProps, prevState) {
    const { questionList, Indexquestion } = this.state
    questionList.getIn([`${Indexquestion}`, 'choQueOptions']) &&
      questionList.getIn([`${Indexquestion}`, 'choQueOptions']).forEach(item => {
        const id = document.getElementById(`selectitem_${item.get('id')}`)
        if (id) {
          id.innerHTML = locale === 'en' ? item.get('options_en') : item.get('options_zh')
        }
      })
  }

  onChange = id => {
    let { questionList, Indexquestion } = this.state
    // 如果已经提交过的就不能再改了
    if (questionList.getIn([`${Indexquestion}`, 'isSelected'])) {
      return
    }
    // 这里 用来修改userselect
    let questionList_ = questionList.toJS()
    if (questionList_[Indexquestion].choQueOptions) {
      questionList_[Indexquestion].choQueOptions = questionList_[Indexquestion].choQueOptions.map(item => {
        if (item.id === id) {
          item = {
            ...item,
            userselect: !item.userselect
          }
        }
        return item
      })
    }
    console.log(91, questionList_)
    this.setState({
      questionList: Immutable.fromJS(questionList_)
    })
  }
  getStatus = item => {
    const { questionList, Indexquestion } = this.state
    if (!questionList.getIn([`${Indexquestion}`, 'isSelected'])) {
      if (item.get('userselect')) {
        return 'correct'
      }
      return ''
    }
    if (questionList.getIn([`${Indexquestion}`, 'isSelected'])) {
      if (item.get('answer')) {
        return 'correct'
      }
      if (!item.get('answer')) {
        if (item.get('userselect')) {
          return 'error'
        }
        return ''
      }
      if (!!item.get('answer') === item.get('userselect')) {
        return 'correct'
      }
      return 'error'
    }
  }
  /** 点击确定 主要用来修改isSelected */
  answerCurrent = () => {
    const { questionList, Indexquestion, correctList, errorList } = this.state
    const {
      intl: { formatMessage }
    } = this.props
    let correctList_ = correctList.toJS()
    let errorList_ = errorList.toJS()
    let questionList_ = questionList.toJS()
    if (!questionList_[Indexquestion] || !questionList_[Indexquestion].choQueOptions) {
      return
    }
    if (questionList_[Indexquestion].choQueOptions.every(item => !item.userselect)) {
      setTimeout(
        () => alert(formatMessage({ id: 'questionAlertmessage' }), '', [{ text: formatMessage({ id: 'Iget' }) }]),
        100
      )
      return
    }
    let asw = ''
    questionList_[Indexquestion].choQueOptions.forEach(item => {
      if (item.userselect) {
        asw += item.name
      }
    })
    questionList_[Indexquestion].isSelected = true
    if (asw === questionList_[Indexquestion].answer) {
      questionList_[Indexquestion].isCorrect = true
      correctList_.push(questionList_[Indexquestion])
    } else {
      questionList_[Indexquestion].isCorrect = false
      errorList_.push(questionList_[Indexquestion])
    }
    this.setState({
      questionList: Immutable.fromJS(questionList_),
      correctList: Immutable.fromJS(correctList_),
      errorList: Immutable.fromJS(errorList_)
    })
  }
  /** 保存成绩 */
  saveResult = (cb, e) => {
    const { dispatch } = this.props
    const { questionList, correctList, errorList, timerest, chapterInfo } = this.state
    let questionList_ = questionList.toJS()
    const obj = _.groupBy(questionList_, 'interestFieldId')
    let arr = [] // 发送到后端的数据
    let session = { arr: [] }
    Object.keys(obj).forEach(key => {
      let count = 0
      console.log(193, obj, obj[key])
      obj[key].forEach(item => {
        if (item.isCorrect) {
          count++
        }
      })
      arr.push({
        interestFieldId: key,
        correctRate: parseFloat(count / obj[key].length).toFixed(2)
      })
      session.arr.push({
        interestField: obj[key][0].interestField,
        correctRate: parseInt((count / obj[key].length) * 100)
      })
    })
    const json = {
      score: parseInt((correctList.size / questionList.size) * 100),
      chapterId: sessionStorage.getItem('chapterId'),
      studentId: sessionStorage.getItem('userid')
    }
    session = {
      ...session,
      allCorrectRate: parseInt((correctList.size / questionList.size) * 100),
      correctsize: correctList.size,
      errorsize: errorList.size,
      testingtime: timetest - timerest
    }
    console.log(session)
    localStorage.setItem('testresult', JSON.stringify(session))
    localStorage.setItem('questionList', JSON.stringify(questionList.toJS()))
    localStorage.setItem('correctList', JSON.stringify(correctList.toJS()))
    localStorage.setItem('errorList', JSON.stringify(errorList.toJS()))
    localStorage.setItem('chapterInfo', JSON.stringify(chapterInfo))
    console.log(206, json)
    dispatch(newResult(json)).then(e => {
      if (e.error) {
        console.log(e.error)
        return
      }
      if (cb) {
        if (e) {
          postMessage()
        }
        cb()
      }
    })
  }
  /** 点击查看结果 */
  jumpToResult = () => {
    const { questionList, correctList, errorList } = this.state
    const { dispatch } = this.props
    this.saveResult(dispatch(pathJump(rootPath.result)))
  }
  /** 点击离开 */
  backToApp = () => {
    const { Indexquestion, questionList } = this.state
    const {
      intl: { formatMessage }
    } = this.props
    if (questionList.getIn([`${questionList.size - 1}`, 'isSelected'])) {
      setTimeout(
        () =>
          alert(formatMessage({ id: 'questionbackAlertmessage2' }), '', [
            {
              text: formatMessage({ id: 'saveandleave' }),
              onPress: e => {
                this.saveResult(window.postMessage, e)
              }
            },
            {
              text: formatMessage({ id: 'continuesee' })
            }
          ]),
        100
      )
    } else {
      setTimeout(
        () =>
          alert(formatMessage({ id: 'questionbackAlertmessage1' }), '', [
            {
              text: formatMessage({ id: 'canceltest' }),
              onPress: () => {
                postMessage()
              }
            },
            { text: formatMessage({ id: 'continuetest' }) }
          ]),
        100
      )
    }
  }
  /** 判断是否正确 */
  getType = () => {
    const { questionList, Indexquestion } = this.state
    console.log(questionList.toJS())
    return questionList.getIn([`${Indexquestion}`, 'isCorrect']) ? 'correct' : 'error'
  }
  render () {
    const {
      intl: { formatMessage, locale },
      location: { pathname },
      count,
      question
    } = this.props
    let { currentStep, Indexquestion, questionList, correctList, animating, errorList, timerest } = this.state

    return (
      <div className='questionfile'>
        <ActivityIndicator toast text='Loading...' animating={animating} />
        <NavBar
          mode='light'
          icon={<Icon onClick={() => console.log('back')} type='left' />}
          leftContent={<span>{formatMessage({ id: 'backToApp' })}</span>}
          onLeftClick={() => {
            this.backToApp()
          }}
        >
          <span>{formatMessage({ id: 'appTitle' })}</span>
        </NavBar>
        <div className='bar'>
          <div className='bar-item'>
            <div>{parseInt(questionList.size - correctList.size - errorList.size)}</div>
            <div />
            <div>{formatMessage({ id: 'questionrest' })}</div>
          </div>
          <div className='bar-item'>
            <div>{parseInt(correctList.size)}</div>
            <div />
            <div>{formatMessage({ id: 'questioncorrect' })}</div>
          </div>
          <div className='bar-item'>
            <div>{parseInt(errorList.size)}</div>
            <div />
            <div>{formatMessage({ id: 'questionerror' })}</div>
          </div>
          <div className='bar-item'>
            <div>{parseInt((correctList.size / questionList.size) * 100) || 0}</div>
            <div />
            <div>{formatMessage({ id: 'correctscore' })}</div>
          </div>
        </div>
        <div>
          {questionList.size > 0 ? (
            <div className='container'>
              <div className='questionTitle'>
                <span>
                  {questionList.getIn([`${Indexquestion}`, 'answer']) &&
                  questionList.getIn([`${Indexquestion}`, 'answer']).length === 1
                    ? formatMessage({ id: 'singleselect' })
                    : formatMessage({ id: 'multiselect' })}
                </span>
                {Indexquestion + 1 + '. '}
                {locale === 'en'
                  ? questionList.getIn([`${Indexquestion}`, 'content_en'])
                  : questionList.getIn([`${Indexquestion}`, 'content_zh'])}
              </div>
              <div className='questionSeleter'>
                {questionList.getIn([`${Indexquestion}`, 'choQueOptions']) &&
                  questionList.getIn([`${Indexquestion}`, 'choQueOptions']).map(item => {
                    const status = this.getStatus(item)
                    const isSelected = questionList.getIn([`${Indexquestion}`, 'isSelected'])
                    console.log(374, isSelected)
                    return (
                      <div
                        className={'questionItem' + ' ' + status}
                        style={isSelected ? { background: '#fff' } : {}}
                        key={item.get('id')}
                        onTouchStart={e => {
                          this.onChange(item.get('id'))
                        }}
                      >
                        {!status ? (
                          <div className='checkbox'>
                            <i>{''}</i>
                            <span>{item.get('name')}</span>
                          </div>
                        ) : status === 'correct' ? (
                          <div className='checkbox'>
                            <i className='iconfont'>&#xe744;</i>
                            <span>{item.get('name')}</span>
                          </div>
                        ) : (
                          <div className='checkbox'>
                            <i className='iconfont'>&#xe7ca;</i>
                            <span>{item.get('name')}</span>
                          </div>
                        )}
                        <div id={`selectitem_${item.get('id')}`} />
                      </div>
                    )
                  })}
              </div>
              {questionList.getIn([`${Indexquestion}`, 'isSelected']) && (
                <div className={'correctanswer' + ` answer_${this.getType()}`}>
                  <div className='answerTitle'>
                    <span className='type'>{formatMessage({ id: `answer_${this.getType()}` })}</span>
                    <span className='con'>
                      {formatMessage({ id: 'correctAnswer' })}
                      {'：'} {questionList.getIn([`${Indexquestion}`, 'answer'])}
                    </span>
                  </div>
                  <div className='explain'>
                    {locale === 'en'
                      ? questionList.getIn([`${Indexquestion}`, 'explain_en'])
                      : questionList.getIn([`${Indexquestion}`, 'explain_zh'])}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                margin: '0.2rem auto',
                textAlign: 'center'
              }}
            >
              {formatMessage({ id: 'no_question' })}
            </div>
          )}
          {!questionList.getIn([`${Indexquestion}`, 'isSelected']) && (
            <div className={'bottomButton nofull'}>
              <Button type='primary' onClick={() => this.answerCurrent()}>
                {formatMessage({ id: 'ok_btn' })}
              </Button>
            </div>
          )}
          {questionList.getIn([`${Indexquestion}`, 'isSelected']) && (
            <div className={'bottomButton twoinline'}>
              <div className='onebtn'>
                <Button
                  disabled={Indexquestion < 1}
                  onClick={() => {
                    if (Indexquestion < 1) {
                      return
                    }
                    this.setState({
                      Indexquestion: Indexquestion - 1
                    })
                  }}
                >
                  <Icon type='left' />
                  {formatMessage({ id: 'pre_question' })}
                </Button>
              </div>
              {Indexquestion < questionList.size - 1 ? (
                <div className='onebtn'>
                  <Button
                    onClick={() => {
                      this.setState({
                        Indexquestion: Indexquestion + 1
                      })
                    }}
                  >
                    {formatMessage({ id: 'next_question' })}
                    <Icon type='right' />
                  </Button>
                </div>
              ) : (
                <div className='onebtn'>
                  <Button
                    onClick={() => {
                      this.jumpToResult()
                    }}
                  >
                    {formatMessage({ id: 'checkresult' })}
                    <Icon type='right' />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}

Question.propTypes = {
  pathJump: React.PropTypes.func
}

const mapStateToProps = state => {
  console.log(state && state.toJS())
  return {}
}
// const mapDispatchToProps = dispatch => {
//   console.log(dispatch)
//   return {
//     ...bindActionCreators(actionCreators, dispatch)
//   }
// }

export default injectIntl(
  connect(
    mapStateToProps
    // mapDispatchToProps
  )(Question)
)
